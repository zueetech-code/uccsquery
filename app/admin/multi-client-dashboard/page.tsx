"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase-client"
import { resolveHeartbeatStatus } from "@/lib/heartbeat"

import {
collection,
getDocs,
addDoc,
doc,
setDoc,
deleteDoc,
serverTimestamp,
query,
where,
orderBy,
limit
} from "firebase/firestore"

export default function MultiClientRunner(){

const [clients,setClients] = useState<any[]>([])
const [users,setUsers] = useState<any[]>([])
const [queries,setQueries] = useState<any[]>([])

const [selectedClients,setSelectedClients] = useState<string[]>([])
const [clientStatus,setClientStatus] = useState<any>({})

const [date,setDate] = useState("")
const [loading,setLoading] = useState(false)
const [lastClosingDates, setLastClosingDates] = useState<any>({})

const [saveMode,setSaveMode] =
useState<"firebase"|"local"|"both">("firebase")
const [selectAll,setSelectAll] = useState(false)

/* ---------------- INIT ---------------- */

useEffect(()=>{ init() },[])

async function init(){

const clientSnap = await getDocs(collection(db,"clients"))
const userSnap = await getDocs(collection(db,"users"))
const querySnap = await getDocs(collection(db,"queries"))
const hbSnap = await getDocs(collection(db,"agent_heartbeats"))

const heartbeats:any={}

hbSnap.docs.forEach(d=>{
heartbeats[d.id]=d.data()
})

const onlineClients = clientSnap.docs
.map(d=>({id:d.id,...d.data()}))
.filter(c => {

const hb = heartbeats[c.id]
if(!hb) return false

const last = hb.lastSeen?.toDate?.() || new Date(hb.lastSeen)

return resolveHeartbeatStatus(last) === "online"

})

setClients(onlineClients)
setUsers(userSnap.docs.map(d=>({id:d.id,...d.data()})))
setQueries(querySnap.docs.map(d=>({id:d.id,...d.data()})))

}

/* ---------------- HELPERS ---------------- */

function toggleClient(id:string){

setSelectedClients(prev=>
prev.includes(id)
? prev.filter(c=>c!==id)
: [...prev,id]
)

}

function getEmail(clientId:string){

const user = users.find(u=>u.clientId===clientId)
return user?.email || "-"

}

function getAgent(clientId:string){

const user = users.find(u=>u.clientId===clientId)
return user?.id

}

function getAgentQueries(agentUid:string){

return queries.filter(q=>
(q.assignedAgents || []).includes(agentUid)
)

}
function toggleSelectAll(){

if(selectAll){

setSelectedClients([])
setSelectAll(false)

}else{

const allIds = clients.map(c => c.id)
setSelectedClients(allIds)
setSelectAll(true)

}

}

/* ---------------- CREATE COMMAND ---------------- */

async function createCommand(clientId:string,agentUid:string,queryId:string){

const ref = await addDoc(collection(db,"commands"),{

clientId,
agentUid,
queryId,

variables:{
Fromdate:date
},

status:"pending",
createdAt:serverTimestamp()

})

return ref.id

}

/* ---------------- WAIT COMMAND ---------------- */

async function waitCommand(commandId:string){

return new Promise<any>((resolve)=>{

const interval=setInterval(async()=>{

const snap = await getDocs(
query(
collection(db,"commands"),
where("__name__","==",commandId)
)
)

if(snap.empty) return

const data:any = snap.docs[0].data()

if(data.status==="success" || data.status==="failed"){

clearInterval(interval)
resolve(data)

}

},1500)

})

}

/* ---------------- WAIT RESULT ---------------- */

async function waitForResult(commandId:string){

return new Promise<void>((resolve)=>{

const interval=setInterval(async()=>{

const snap = await getDocs(
query(
collection(db,"temp_query_results"),
where("originalCommandId","==",commandId)
)
)

if(!snap.empty){

clearInterval(interval)
resolve()

}

},1500)

})

}

/* ---------------- FETCH RESULT ---------------- */

async function fetchResults(commandId:string){

const q = query(
collection(db,"temp_query_results"),
where("originalCommandId","==",commandId),
orderBy("createdAt","desc"),
limit(1)
)

const snap = await getDocs(q)

if(snap.empty)
return {rows:[],columnOrder:[]}

const resultDoc = snap.docs[0]
const meta = resultDoc.data()

const rowsSnap = await getDocs(
collection(db,"temp_query_results",resultDoc.id,"rows")
)

const rows = rowsSnap.docs.map(d=>d.data())

return{
rows,
columnOrder:meta.columnOrder || []
}

}

/* ---------------- SAVE LOCAL ---------------- */

async function saveLocal(report:any){

await fetch("/api/save-report",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(report)
})

}
async function reportAlreadyExists(clientName:string){

const ref = doc(db,"final_reports",`${clientName}_${date}`)

const snap = await getDocs(
query(
collection(db,"final_reports"),
where("__name__","==",`${clientName}_${date}`)
)
)

return !snap.empty
}
async function checkSubmissionStatus(){

if(!date){
alert("Select date first")
return
}

const statusMap:any = {}

for(const c of clients){

const id = `${c.name}_${date}`

const snap = await getDocs(
query(
collection(db,"final_reports"),
where("__name__","==",id)
)
)

if(!snap.empty){
statusMap[c.id] = "Completed"
}else{
statusMap[c.id] = "Idle"
}

}

setClientStatus(statusMap)

}
useEffect(()=>{

if(clients.length && date){
checkSubmissionStatus()
}

},[clients,date])

/* ---------------- PROCESS CLIENT ---------------- */

async function processClient(clientId:string){

const client = clients.find(c=>c.id===clientId)
const clientName = client?.name || clientId

/* check if report already exists */

const exists = await reportAlreadyExists(clientName)

if(exists){

setClientStatus((prev: any)=>({...prev,[clientId]:"Completed"}))
return

}

setClientStatus((prev: any)=>({...prev,[clientId]:"Running"}))

try{

const agentUid = getAgent(clientId)
if(!agentUid) throw new Error("No agent")

const agentQueries = getAgentQueries(agentUid)

const client = clients.find(c=>c.id===clientId)
const clientName = client?.name || clientId

const report:any={

clientId,
clientName,
fromDate:date,

branch:[],
member:[],
deposit:[],
loan:[],
jewel:[],

branchColumnOrder:[],
memberColumnOrder:[],
depositColumnOrder:[],
loanColumnOrder:[],
jewelColumnOrder:[],

updatedAt:serverTimestamp()

}

/* -------- RUN QUERIES SEQUENTIALLY -------- */

for(const q of agentQueries){

/* create command */

const commandId = await createCommand(clientId,agentUid,q.id)

/* wait command */

const cmdData:any = await waitCommand(commandId)

if(cmdData.status!=="success")
continue

/* wait result */

await waitForResult(commandId)

/* fetch result */

const {rows,columnOrder} = await fetchResults(commandId)

if(!rows.length)
continue

const name = q.name.toLowerCase()

/* branch */

if(name.includes("branch")){

report.branch = rows
report.branchColumnOrder = columnOrder

}

/* deposit */

if(name.includes("deposit")){

const members = rows.filter((r:any)=>r.modules==="Members")
const deposits = rows.filter((r:any)=>r.modules==="Deposits")
const loans = rows.filter((r:any)=>r.modules==="Loans")

report.member = members
report.deposit = deposits
report.loan = loans

report.memberColumnOrder = [...columnOrder]
report.depositColumnOrder = [...columnOrder]
report.loanColumnOrder = [...columnOrder]

}

/* jewel */

if(name.includes("jewel")){

report.jewel = rows
report.jewelColumnOrder = columnOrder

}

/* save partial report */

const tasks:any[]=[]

if(saveMode==="firebase" || saveMode==="both"){

tasks.push(
setDoc(
doc(db,"final_reports",`${clientName}_${date}`),
report,
{merge:true}
)
)

}

if(saveMode==="local" || saveMode==="both"){

tasks.push(saveLocal(report))

}

await Promise.all(tasks)

}

/* completed */

setClientStatus((prev: any)=>({...prev,[clientId]:"Completed"}))

}catch(err){

console.error(err)

setClientStatus((prev: any)=>({...prev,[clientId]:"Failed"}))

}

}

/* ---------------- RUN ---------------- */

async function run(){

if(!date)
return alert("Select Date")

if(selectedClients.length===0)
return alert("Select Clients")

/* skip already completed */

const clientsToRun = selectedClients.filter(
id => clientStatus[id] !== "Completed"
)

if(clientsToRun.length === 0){
alert("All selected clients already completed")
return
}

setLoading(true)

const MAX_PARALLEL=15
let index=0

async function worker(){

while(true){

const i=index++

if(i>=clientsToRun.length)
break

await processClient(clientsToRun[i])

}

}

const workers=[]

for(let i=0;i<MAX_PARALLEL;i++)
workers.push(worker())

await Promise.all(workers)

setLoading(false)

alert("All Clients Completed")

}
function formatDateDMY(dateValue: any) {

  if (!dateValue) return "-"

  const d =
    dateValue?.toDate?.() || // Firestore Timestamp
    new Date(dateValue)

  if (isNaN(d.getTime())) return "-"

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()

  return `${day}-${month}-${year}`
}
async function fetchLastClosingDates() {

  const map:any = {}

  for (const c of clients) {

    const q = query(
      collection(db,"cashbalances"),
      where("clientName","==",c.name),
      orderBy("lastClosingDate","desc"),
      limit(1)
    )

    const snap = await getDocs(q)

    if(!snap.empty){

      const data:any = snap.docs[0].data()

      const lastDate =
        data.lastClosingDate?.toDate?.() ||
        data.lastClosingDate

      map[c.id] = formatDateDMY(lastDate)

    }else{

      map[c.id] = "-"

    }

  }

  setLastClosingDates(map)

}
useEffect(() => {

  if (clients.length > 0) {
    fetchLastClosingDates()
  }

}, [clients])
/* ---------------- UI ---------------- */

return(

<div className="p-10 space-y-6">

<h1 className="text-2xl font-bold">
Multi Client Get Data
</h1>

<div className="flex gap-4">

<input
type="date"
value={date}
onChange={(e)=>setDate(e.target.value)}
className="border px-3 py-2 rounded"
/>

<select
value={saveMode}
onChange={(e)=>setSaveMode(e.target.value as any)}
className="border px-3 py-2 rounded"
>

<option value="firebase">Online</option>
<option value="local">Local Server</option>
<option value="both">Both</option>

</select>

<button
onClick={run}
disabled={loading}
className="bg-blue-600 text-white px-6 py-2 rounded"
>
{loading ? "Running..." : "Run Selected Clients"}
</button>

<button
onClick={checkSubmissionStatus}
className="bg-green-600 text-white px-6 py-2 rounded"
>
Check Status
</button>

</div>

<table className="w-full border">

<thead className="bg-gray-100">

<tr>

<th className="border p-2">Client</th>
<th className="border p-2">Email</th>
<th className="border p-2">Last Closing Date</th>
<th className="border p-2">Status</th>
<th className="border p-2">

<input
type="checkbox"
checked={selectAll}
onChange={toggleSelectAll}
/>

</th>

</tr>

</thead>

<tbody>

{clients.map(c=>{

const status = clientStatus[c.id] || "Idle"

return(

<tr key={c.id}>

<td className="border p-2">
{c.name}
</td>

<td className="border p-2">
{getEmail(c.id)}
</td>
<td className="border p-2">
  {lastClosingDates[c.id] || "-"}
</td>

<td className="border p-2">
{status}
</td>

<td className="border p-2">

<input
type="checkbox"
checked={selectedClients.includes(c.id)}
onChange={()=>toggleClient(c.id)}
/>

</td>

</tr>

)

})}

</tbody>

</table>

</div>

)

}