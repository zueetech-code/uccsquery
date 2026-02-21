"use client"

import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase-client"
import { setDoc } from "firebase/firestore"
import {  orderBy, limit } from "firebase/firestore"
import * as XLSX from "xlsx"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function FillDataPage() {

  /* ================= BASIC STATE ================= */
  const [activeTab, setActiveTab] = useState("branch")
  const [Fromdate, setFromdate] = useState("")
  const [clientId, setClientId] = useState("")
  const [agentUid, setAgentUid] = useState("")
  const [queries, setQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const [sdsCode, setSdsCode] = useState("")
  const [reportDate, setReportDate] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [previewStep, setPreviewStep] = useState(0)


  const [fetchedData, setFetchedData] = useState<any>({
    branch: [],
    member: [],
    deposit: [],
    loan: [],
    jewel: []
  })

  const [columnOrders, setColumnOrders] = useState<any>({
    branch: [],
    member: [],
    deposit: [],
    loan: [],
    jewel: []
  })

 /* ================= NPA ================= */
  const [npaData, setNpaData] = useState({
    SDSCode: "",
    Date: "",
    GNPA: {amount: "", percent: ""},
    NNPA: {amount: "", percent: ""},
    ProvisionPercent: "",
    TotalOverdue:{  count: "", amount: "" },
    NoActionTaken:{  count: "", amount: "" },
    RegisteredNoticesSent:{  count: "", amount: "" },
    ActionTaken: {
      ARC: {  count: "", amount: "" },
      DECREE: {  count: "", amount: "" },
      EP: {  count: "", amount: "" }
    }
  })

  /* ================= PROFIT ================= */
  const [profitData, setProfitData] = useState({
    SDSCode: "",
    Date: "",
    CDRatio: "",
    OtherIncome: "",
    Expenditure: "",
    ProfitLoss: {
      AuditCompletedYear: "",
      NetProfit: "",
      CurrentProfitWithCumulativeLoss: "",
      CurrentLossWithAccumulatedLoss: ""
    }
  })

  /* ================= SAFETY ================= */
  const [safetyData, setSafetyData] = useState({
    SDSCode: "",
    Date: "",
    SafetyLocker: "",
    DefenderDoor: "",
    BurglaryAlarm: "",
    CCTV: "",
    SMSAlert: ""
  })

  /* ================= Emplyee ================= */
  const [empdata, setEmpData] = useState({
    SDSCode: "",
    Date: "",
    ApprovedCadreStrength: "",
    Filled: "",
    Vacant: ""
  })

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser
      if (!user) return

      setAgentUid(user.uid)

      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) return

      setClientId(userDoc.data().clientId)

      const snap = await getDocs(collection(db, "queries"))
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(q => (q.assignedAgents || []).includes(user.uid))

      setQueries(filtered)
    }

    init()
  }, [])

  /* ================= WAIT UNTIL COMMAND SUCCESS ================= */
  const waitForCommandSuccess = (commandId: string) => {
    return new Promise<void>((resolve, reject) => {

      const unsubscribe = onSnapshot(
        doc(db, "commands", commandId),
        (snapshot) => {

          if (!snapshot.exists()) return

          const data = snapshot.data()

          if (data.status === "success") {
            unsubscribe()
            resolve()
          }

          if (data.status === "failed") {
            unsubscribe()
            reject(new Error("Query failed"))
          }
        }
      )

      setTimeout(() => {
        unsubscribe()
        reject(new Error("Query timeout"))
      }, 240000)
    })
  }

  /* ================= FETCH RESULT ================= */
  const fetchResultFromTemp = async (commandId: string) => {

    const q = query(
      collection(db, "temp_query_results"),
      where("originalCommandId", "==", commandId),
      where("originalAgentUid", "==", agentUid)
    )

    const snap = await getDocs(q)

    if (snap.empty)
      return { rows: [], columnOrder: [] }

    const docMatch = snap.docs[0]
    const meta = docMatch.data()

    const rowsSnap = await getDocs(
      collection(db, "temp_query_results", docMatch.id, "rows")
    )

    return {
      rows: rowsSnap.docs.map(d => d.data()),
      columnOrder: meta.columnOrder || []
    }
  }

  /* ================= RUN SINGLE QUERY ================= */
  const runQuery = async (keyword: string) => {

    const queryObj = queries.find(q =>
      q.name.toLowerCase().includes(keyword)
    )

    if (!queryObj)
      return { rows: [], columnOrder: [] }

    const commandRef = await addDoc(collection(db, "commands"), {
      clientId,
      agentUid,
      queryId: queryObj.id,
      variables: { Fromdate },
      status: "pending",
      createdAt: serverTimestamp()
    })

    await waitForCommandSuccess(commandRef.id)

    return await fetchResultFromTemp(commandRef.id)
  }

  //Dowload Excel
  const downloadExcel = () => {
          const wb = XLSX.utils.book_new()

          const addSheetWithOrder = (
            name: string,
            data: any[],
            columns: string[]
          ) => {
            if (!data.length || !columns.length) return

            const sheetData = [
              columns, // header row
              ...data.map(row => columns.map(col => row[col] ?? ""))
            ]

            const ws = XLSX.utils.aoa_to_sheet(sheetData)
            XLSX.utils.book_append_sheet(wb, ws, name)
          }
          const addKeyValueSheet = (
            name: string,
            fields: [string, (d: any) => any][],
            data: any
          ) => {
            const rows = [
              ["Field", "Value"],
              ...fields.map(([label, getter]) => [label, getter(data) ?? ""])
            ]

            const ws = XLSX.utils.aoa_to_sheet(rows)
            XLSX.utils.book_append_sheet(wb, ws, name)
          }

          addSheetWithOrder("Branch", fetchedData.branch, columnOrders.branch)
          addSheetWithOrder("Members", fetchedData.member, columnOrders.member)
          addSheetWithOrder("Deposits", fetchedData.deposit, columnOrders.deposit)
          addSheetWithOrder("Loans", fetchedData.loan, columnOrders.loan)
          addSheetWithOrder("Jewel", fetchedData.jewel, columnOrders.jewel)

          addKeyValueSheet("NPA", NPA_FIELDS, npaData)
          addKeyValueSheet("Profit", PROFIT_FIELDS, profitData)
          addKeyValueSheet("Employee", EMP_FIELDS, empdata)
          addKeyValueSheet("Safety", SAFETY_FIELDS, safetyData)

          XLSX.writeFile(
            wb,
            `Report_${sdsCode}_${reportDate}.xlsx`
          )
        }
      //Handle Preview and Download

      const handlePreviewOk = async () => {
        await handleSubmitReport()   // ✅ your existing save logic
        downloadExcel()              // ✅ Excel download
        setShowPreview(false)
        setPreviewStep(0)
      }


     const PreviewTable = ({ title, data }: any) => (
        <>
          <h3 className="font-semibold mb-2">{title}</h3>
          <table className="w-full border text-sm">
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.values(row).map((v: any, j: number) => (
                    <td key={j} className="border px-2 py-1">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )

      const PreviewObject = ({ title, data }: any) => (
        <>
          <h3 className="font-semibold mb-2">{title}</h3>
          {Object.entries(data).map(([k, v]) => (
            <p key={k}>
              <b>{k}:</b> {JSON.stringify(v)}
            </p>
          ))}
        </>
      )
      const NPA_FIELDS = [
          ["SDS Code", (d: any) => d.SDSCode],
          ["Date", (d: any) => d.Date],
          ["GNPA Amount", (d: any) => d.GNPA.amount],
          ["GNPA %", (d: any) => d.GNPA.percent],
          ["NNPA Amount", (d: any) => d.NNPA.amount],
          ["NNPA %", (d: any) => d.NNPA.percent],
          ["Provision %", (d: any) => d.ProvisionPercent],
          ["Total Overdue Count", (d: any) => d.TotalOverdue.count],
          ["Total Overdue Amount", (d: any) => d.TotalOverdue.amount],
          ["No Action Taken Count", (d: any) => d.NoActionTaken.count],
          ["No Action Taken Amount", (d: any) => d.NoActionTaken.amount],
          ["Registered Notices Count", (d: any) => d.RegisteredNoticesSent.count],
          ["Registered Notices Amount", (d: any) => d.RegisteredNoticesSent.amount],
          ["ARC Count", (d: any) => d.ActionTaken.ARC.count],
          ["ARC Amount", (d: any) => d.ActionTaken.ARC.amount],
          ["DECREE Count", (d: any) => d.ActionTaken.DECREE.count],
          ["DECREE Amount", (d: any) => d.ActionTaken.DECREE.amount],
          ["EP Count", (d: any) => d.ActionTaken.EP.count],
          ["EP Amount", (d: any) => d.ActionTaken.EP.amount],
        ]

        const PROFIT_FIELDS = [
          ["SDS Code", (d: any) => d.SDSCode],
          ["Date", (d: any) => d.Date],
          ["CD Ratio", (d: any) => d.CDRatio],
          ["Other Income", (d: any) => d.OtherIncome],
          ["Expenditure", (d: any) => d.Expenditure],
          ["Audit Completed Year", (d: any) => d.ProfitLoss.AuditCompletedYear],
          ["Net Profit", (d: any) => d.ProfitLoss.NetProfit],
          ["Current Profit with Cumulative Loss", (d: any) => d.ProfitLoss.CurrentProfitWithCumulativeLoss],
          ["Current Loss with Accumulated Loss", (d: any) => d.ProfitLoss.CurrentLossWithAccumulatedLoss],
        ]

        const EMP_FIELDS = [
          ["SDS Code", (d: any) => d.SDSCode],
          ["Date", (d: any) => d.Date],
          ["Approved Cadre Strength", (d: any) => d.ApprovedCadreStrength],
          ["Filled", (d: any) => d.Filled],
          ["Vacant", (d: any) => d.Vacant],
        ]

        const SAFETY_FIELDS = [
          ["SDS Code", (d: any) => d.SDSCode],
          ["Date", (d: any) => d.Date],
          ["Safety Locker", (d: any) => d.SafetyLocker],
          ["Defender Door", (d: any) => d.DefenderDoor],
          ["Burglary Alarm", (d: any) => d.BurglaryAlarm],
          ["CCTV", (d: any) => d.CCTV],
          ["SMS Alert", (d: any) => d.SMSAlert],
        ]


     const PreviewTableWithColumns = ({
          title,
          data,
          columns
        }: {
          title: string
          data: any[]
          columns: string[]
        }) => {
          if (!data.length || !columns.length) return null

          return (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{title}</h3>

              <div className="overflow-x-auto border">
                <table className="table-auto border-collapse w-full text-sm">
                  <thead>
                    <tr>
                      {columns.map((col, i) => (
                        <th
                          key={i}
                          className="border px-2 py-1 bg-muted text-left"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {columns.map((col, cIdx) => (
                          <td key={cIdx} className="border px-2 py-1">
                            {row[col] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
     const PreviewKeyValue = ({
          title,
          fields,
          data
        }: {
          title: string
          fields: [string, (d: any) => any][]
          data: any
        }) => (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">{title}</h3>
            <table className="border w-full text-sm">
              <tbody>
                {fields.map(([label, getter], i) => (
                  <tr key={i}>
                    <td className="border px-3 py-2 font-medium w-1/2">
                      {label}
                    </td>
                    <td className="border px-3 py-2">
                      {String(getter(data) ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )


  /* ================= HANDLE GET DATA ================= */
 const handleGetData = async () => {

  if (loading) return
  if (!Fromdate) return

  setLoading(true)

  const newData: any = {
    branch: [],
    member: [],
    deposit: [],
    loan: [],
    jewel: []
  }

  try {

    const docId = `${clientId}_${Fromdate}`

    let branchResult: any = null
    let combined: any = null
    let jewelResult: any = null

    /* =======================================================
       STEP 1: CHECK EXACT SAME DATE REPORT
    ======================================================= */

    setProgress("Checking existing report for this date...")

    const exactDoc = await getDoc(
      doc(db, "final_reports", docId)
    )

    if (exactDoc.exists()) {

      const data = exactDoc.data()

      setProgress("Loading full report from existing saved data...")

      const newColumnOrders = {
        branch: data.branchColumnOrder || [],
        member: data.memberColumnOrder || [],
        deposit: data.depositColumnOrder || [],
        loan: data.loanColumnOrder || [],
        jewel: data.jewelColumnOrder || []
      }

      const fetched = {
        branch: data.branch || [],
        member: data.member || [],
        deposit: data.deposit || [],
        loan: data.loan || [],
        jewel: data.jewel || []
      }

      setFetchedData(fetched)
      setColumnOrders(newColumnOrders)

      setNpaData(data.npa || npaData)
      setProfitData(data.profit || profitData)
      setSafetyData(data.safety || safetyData)
      setEmpData(data.emp || empdata)

      // ✅ SET DATE FROM SAVED REPORT
      const existingDate =
        data.npa?.Date ||
        data.profit?.Date ||
        data.emp?.Date ||
        Fromdate

      setReportDate(existingDate)

      // ✅ SET SDS CODE FROM SAVED REPORT
      const existingSds =
        data.npa?.SDSCode ||
        data.profit?.SDSCode ||
        data.emp?.SDSCode ||
        ""

      setSdsCode(existingSds)

      // ✅ SYNC DATE & SDS INTO ALL TAB STATES
      setNpaData(prev => ({ ...prev, Date: existingDate, SDSCode: existingSds }))
      setProfitData(prev => ({ ...prev, Date: existingDate, SDSCode: existingSds }))
      setSafetyData(prev => ({ ...prev, Date: existingDate, SDSCode: existingSds }))
      setEmpData(prev => ({ ...prev, Date: existingDate, SDSCode: existingSds }))


      setProgress("Loaded from existing report")
      setLoading(false)
      return
    }

    /* =======================================================
       STEP 2: CHECK ANY PREVIOUS REPORT (STATIC LOAD)
    ======================================================= */

    setProgress("Checking previous reports for static data...")

    const latestSnap = await getDocs(
      query(
        collection(db, "final_reports"),
        where("clientId", "==", clientId),
        orderBy("updatedAt", "desc"),
        limit(1)
      )
    )

    if (!latestSnap.empty) {

      const latestData = latestSnap.docs[0].data()

      newData.branch = latestData.branch || []

      setNpaData(latestData.npa || npaData)
      setProfitData(latestData.profit || profitData)
      setSafetyData(latestData.safety || safetyData)
      setEmpData(latestData.emp || empdata)

      // ✅ SET DATE FROM LATEST REPORT
      const latestDate =
        latestData.npa?.Date ||
        latestData.profit?.Date ||
        latestData.emp?.Date ||
        Fromdate

      setReportDate(latestDate)

      // ✅ SET SDS CODE FROM LATEST REPORT
      const latestSds =
        latestData.npa?.SDSCode ||
        latestData.profit?.SDSCode ||
        latestData.emp?.SDSCode ||
        ""

      setSdsCode(latestSds)

      // ✅ SYNC INTO ALL TAB STATES
      setNpaData(prev => ({ ...prev, Date: latestDate, SDSCode: latestSds }))
      setProfitData(prev => ({ ...prev, Date: latestDate, SDSCode: latestSds }))
      setSafetyData(prev => ({ ...prev, Date: latestDate, SDSCode: latestSds }))
      setEmpData(prev => ({ ...prev, Date: latestDate, SDSCode: latestSds }))


      branchResult = {
        columnOrder: latestData.branchColumnOrder || []
      }

    } else {

      /* =======================================================
         STEP 3: NO REPORTS AT ALL → RUN BRANCH QUERY
      ======================================================= */

      setProgress("No previous report found. Executing Branch query...")

      branchResult = await runQuery("branch")

      newData.branch = branchResult.rows
    }

    /* =======================================================
       STEP 4: ALWAYS RUN DATE-DEPENDENT QUERIES
    ======================================================= */

    setProgress("Executing Deposit/Loan/Member query...")

    combined = await runQuery("deposit")

    const allRows = combined.rows

    newData.member = allRows.filter((r: { type: string }) => r.type === "Members")
    newData.deposit = allRows.filter((r: { type: string }) => r.type === "Deposits")
    newData.loan = allRows.filter((r: { type: string }) => r.type === "Loans")

    setProgress("Executing Jewel query...")

    jewelResult = await runQuery("jewel")

    newData.jewel = jewelResult.rows

    /* =======================================================
       FINAL: SET STATE ONCE (IMPORTANT FIX)
    ======================================================= */

    const newColumnOrders = {
      branch: branchResult?.columnOrder || [],
      member: combined?.columnOrder || [],
      deposit: combined?.columnOrder || [],
      loan: combined?.columnOrder || [],
      jewel: jewelResult?.columnOrder || []
    }

    setFetchedData(newData)
    setColumnOrders(newColumnOrders)

    setProgress("All queries completed successfully")
    if (newData.branch && newData.branch.length > 0) {
      const firstRow = newData.branch[0]

      const code =
        firstRow.sdscode ||
        firstRow.SDSCODE ||
        firstRow.sdsCode ||
        ""

      setSdsCode(code)
    }
    setReportDate(Fromdate)

  } catch (error) {
    console.error(error)
    setProgress("Error while executing queries")
  }

  setLoading(false)
}


//Summit to Reports
 const handleSubmitReport = async () => {

  if (!clientId || !Fromdate) {
    alert("Client ID or From Date missing")
    return
  }

  try {

    const docId = `${clientId}_${Fromdate}`

    const reportRef = doc(db, "final_reports", docId)
    const existingDoc = await getDoc(reportRef)

    // 🔥 FORCE DATE & SDS INTO ALL TAB OBJECTS
    const updatedNpa = {
      ...npaData,
      SDSCode: npaData.SDSCode || "",
      Date: npaData.Date || Fromdate
    }

    const updatedProfit = {
      ...profitData,
      SDSCode: profitData.SDSCode || "",
      Date: profitData.Date || Fromdate
    }

    const updatedSafety = {
      ...safetyData,
      SDSCode: safetyData.SDSCode || "",
      Date: safetyData.Date || Fromdate
    }

    const updatedEmp = {
      ...empdata,
      SDSCode: empdata.SDSCode || "",
      Date: empdata.Date || Fromdate
    }

    const reportData = {
      clientId,
      fromDate: Fromdate,

      updatedBy: agentUid,
      updatedAt: serverTimestamp(),

      branch: fetchedData.branch,
      member: fetchedData.member,
      deposit: fetchedData.deposit,
      loan: fetchedData.loan,
      jewel: fetchedData.jewel,

      // 🔥 SAVE COLUMN ORDERS
      branchColumnOrder: columnOrders.branch || [],
      memberColumnOrder: columnOrders.member || [],
      depositColumnOrder: columnOrders.deposit || [],
      loanColumnOrder: columnOrders.loan || [],
      jewelColumnOrder: columnOrders.jewel || [],

      // 🔥 SAVE UPDATED TAB DATA
      npa: updatedNpa,
      profit: updatedProfit,
      safety: updatedSafety,
      emp: updatedEmp
    }

    if (!existingDoc.exists()) {
      await setDoc(reportRef, {
        ...reportData,
        createdBy: agentUid,
        createdAt: serverTimestamp()
      })
    } else {
      await setDoc(reportRef, reportData, { merge: true })
    }

    alert("Report saved successfully!")

      // 🔥 CLEAR EVERYTHING AFTER SAVE
      setFetchedData({
        branch: [],
        member: [],
        deposit: [],
        loan: [],
        jewel: []
      })

      setColumnOrders({
        branch: [],
        member: [],
        deposit: [],
        loan: [],
        jewel: []
      })

      setNpaData({
        SDSCode: "",
        Date: "",
        GNPA: { amount: "", percent: "" },
        NNPA: { amount: "", percent: "" },
        ProvisionPercent: "",
        TotalOverdue: { count: "", amount: "" },
        NoActionTaken: { count: "", amount: "" },
        RegisteredNoticesSent: { count: "", amount: "" },
        ActionTaken: {
          ARC: { count: "", amount: "" },
          DECREE: { count: "", amount: "" },
          EP: { count: "", amount: "" }
        }
      })

      setProfitData({
        SDSCode: "",
        Date: "",
        CDRatio: "",
        OtherIncome: "",
        Expenditure: "",
        ProfitLoss: {
          AuditCompletedYear: "",
          NetProfit: "",
          CurrentProfitWithCumulativeLoss: "",
          CurrentLossWithAccumulatedLoss: ""
        }
      })

      setSafetyData({
        SDSCode: "",
        Date: "",
        SafetyLocker: "",
        DefenderDoor: "",
        BurglaryAlarm: "",
        CCTV: "",
        SMSAlert: ""
      })

      setEmpData({
        SDSCode: "",
        Date: "",
        ApprovedCadreStrength: "",
        Filled: "",
        Vacant: ""
      })

      // Optional: Reset Fromdate also
      setFromdate("")

      // Optional: Go back to branch tab
      setActiveTab("branch")


  } catch (error) {
    console.error(error)
    alert("Error saving report")
  }
}



  /* ================= EDITABLE TABLE ================= */
const renderTable = (tab: string) => {
  const data = fetchedData[tab] || [];
  const columns = columnOrders[tab] || [];
  const isEditable = tab === "branch"; // 🔥 only branch editable

  if (!data.length)
    return <p className="text-muted-foreground">No data available</p>;

  return (
    <div className="overflow-x-auto">

      {/* Date (global, editable if you want) */}
      <div className="flex items-center mb-2">
        <Label className="w-64">Date</Label>
        <Input
          type="date"
          className="w-44 h-8 rounded-none"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
      </div>

      <table className="table-auto border-collapse w-full">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="border px-3 py-2 text-left whitespace-nowrap bg-muted"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rIdx) => (
            <tr key={row.id || rIdx}>
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  className="border px-2 py-1 whitespace-nowrap"
                >
                  <Input
                    value={row[col] || ""}
                    readOnly={!isEditable} // 🔥 READ ONLY FOR NON-BRANCH
                    disabled={!isEditable}
                    onChange={(e) => {
                      if (!isEditable) return;

                      const updated = data.map(r => ({ ...r }));
                      updated[rIdx][col] = e.target.value;

                      setFetchedData(prev => ({
                        ...prev,
                        [tab]: updated
                      }));
                    }}
                    className={`min-w-[100px] w-auto border-0 focus:ring-0 ${
                      !isEditable ? "bg-muted cursor-not-allowed" : ""
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



/* ================= RENDER ================= */
const renderTabContent = () => {
  if (["branch","member","deposit","loan","jewel"].includes(activeTab)) 
    return renderTable(activeTab)

    if (activeTab === "npa")
            return (
                  <div className="max-w-5xl space-y-5 text-sm">
                    <div className="flex items-center">
                    <Label className="w-64">SDS Code</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={sdsCode}
                      readOnly
                    />
                  </div>

                {/* Date */}
                <div className="flex items-center">
                  <Label className="w-64">Date</Label>
                  <Input
                    type="date"
                    className="w-44 h-8 rounded-none"
                    value={reportDate}
                    onChange={(e) =>
                      setReportDate(e.target.value)
                    }
                  />
                </div>

                {/* GNPA / NNPA */}
                <div className="grid grid-cols-2 gap-y-4">

                  <div className="flex items-center">
                    <Label className="w-64">GNPA Amount</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={npaData.GNPA.amount}
                      onChange={(e) =>
                        setNpaData({
                          ...npaData,
                          GNPA: { ...npaData.GNPA, amount: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center">
                    <Label className="w-64">GNPA %</Label>
                    <Input
                      className="w-24 h-8 rounded-none"
                      value={npaData.GNPA.percent}
                      onChange={(e) =>
                        setNpaData({
                          ...npaData,
                          GNPA: { ...npaData.GNPA, percent: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center">
                    <Label className="w-64">NNPA Amount</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={npaData.NNPA.amount}
                      onChange={(e) =>
                        setNpaData({
                          ...npaData,
                          NNPA: { ...npaData.NNPA, amount: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center">
                    <Label className="w-64">NNPA %</Label>
                    <Input
                      className="w-24 h-8 rounded-none"
                      value={npaData.NNPA.percent}
                      onChange={(e) =>
                        setNpaData({
                          ...npaData,
                          NNPA: { ...npaData.NNPA, percent: e.target.value }
                        })
                      }
                    />
                  </div>

                </div>

                {/* Provision */}
                <div className="flex items-center">
                  <Label className="w-64">Provision %</Label>
                  <Input
                    className="w-24 h-8 rounded-none"
                    value={npaData.ProvisionPercent}
                    onChange={(e) =>
                      setNpaData({ ...npaData, ProvisionPercent: e.target.value })
                    }
                  />
                </div>

                {/* Section Divider */}
                <div className="border-t pt-4" />

                {/* Count / Amount Sections */}
                {[
                  { label: "Total Overdue", key: "TotalOverdue" },
                  { label: "No Action Taken", key: "NoActionTaken" },
                  { label: "Registered Notices Sent", key: "RegisteredNoticesSent" },
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-2 gap-y-4">

                    <div className="flex items-center">
                      <Label className="w-64">{item.label} Count</Label>
                      <Input
                        className="w-28 h-8 rounded-none"
                        value={npaData[item.key].count}
                        onChange={(e) =>
                          setNpaData({
                            ...npaData,
                            [item.key]: {
                              ...npaData[item.key],
                              count: e.target.value
                            }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center">
                      <Label className="w-64">{item.label} Amount</Label>
                      <Input
                        className="w-32 h-8 rounded-none"
                        value={npaData[item.key].amount}
                        onChange={(e) =>
                          setNpaData({
                            ...npaData,
                            [item.key]: {
                              ...npaData[item.key],
                              amount: e.target.value
                            }
                          })
                        }
                      />
                    </div>

                  </div>
                ))}

                {/* Action Taken Section */}
                <div className="border-t pt-4" />

                {[
                  { label: "ARC", key: "ARC" },
                  { label: "DECREE", key: "DECREE" },
                  { label: "EP", key: "EP" },
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-2 gap-y-4">

                    <div className="flex items-center">
                      <Label className="w-64">Action - {item.label} Count</Label>
                      <Input
                        className="w-28 h-8 rounded-none"
                        value={npaData.ActionTaken[item.key].count}
                        onChange={(e) =>
                          setNpaData({
                            ...npaData,
                            ActionTaken: {
                              ...npaData.ActionTaken,
                              [item.key]: {
                                ...npaData.ActionTaken[item.key],
                                count: e.target.value
                              }
                            }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center">
                      <Label className="w-64">Action - {item.label} Amount</Label>
                      <Input
                        className="w-32 h-8 rounded-none"
                        value={npaData.ActionTaken[item.key].amount}
                        onChange={(e) =>
                          setNpaData({
                            ...npaData,
                            ActionTaken: {
                              ...npaData.ActionTaken,
                              [item.key]: {
                                ...npaData.ActionTaken[item.key],
                                amount: e.target.value
                              }
                            }
                          })
                        }
                      />
                    </div>

                  </div>
                ))}

              </div>
            );


     if (activeTab === "profit")
              return (
                <div className="max-w-5xl space-y-6 text-sm">
                  
                    <div className="flex items-center">
                    <Label className="w-64">SDS Code</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={sdsCode}
                      readOnly
                    />
                  </div>
                   {/* Date */}
                <div className="flex items-center">
                  <Label className="w-64">Date</Label>
                  <Input
                    type="date"
                    className="w-44 h-8 rounded-none"
                    value={reportDate}
                    onChange={(e) =>
                      setReportDate(e.target.value)
                    }
                  />
                </div>

                  <div className="grid grid-cols-2 gap-y-4">

                    {/* LEFT COLUMN */}
                    <div className="space-y-4">

                      <div className="flex items-center">
                        <Label className="w-64">CD Ratio (%)</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.CDRatio}
                          onChange={(e) =>
                            setProfitData({ ...profitData, CDRatio: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex items-center">
                        <Label className="w-64">Expenditure</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.Expenditure}
                          onChange={(e) =>
                            setProfitData({ ...profitData, Expenditure: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex items-center">
                        <Label className="w-64">Net Profit</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.ProfitLoss.NetProfit}
                          onChange={(e) =>
                            setProfitData({
                              ...profitData,
                              ProfitLoss: {
                                ...profitData.ProfitLoss,
                                NetProfit: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center">
                        <Label className="w-64">Current Loss with Accumulated Loss</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.ProfitLoss.CurrentLossWithAccumulatedLoss}
                          onChange={(e) =>
                            setProfitData({
                              ...profitData,
                              ProfitLoss: {
                                ...profitData.ProfitLoss,
                                CurrentLossWithAccumulatedLoss: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-4">

                      <div className="flex items-center">
                        <Label className="w-64">Other Income</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.OtherIncome}
                          onChange={(e) =>
                            setProfitData({ ...profitData, OtherIncome: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex items-center">
                        <Label className="w-64">Audit Completed Year</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.ProfitLoss.AuditCompletedYear}
                          onChange={(e) =>
                            setProfitData({
                              ...profitData,
                              ProfitLoss: {
                                ...profitData.ProfitLoss,
                                AuditCompletedYear: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center">
                        <Label className="w-64">Current Profit with Cumulative Loss</Label>
                        <Input
                          className="w-32 h-8 rounded-none"
                          value={profitData.ProfitLoss.CurrentProfitWithCumulativeLoss}
                          onChange={(e) =>
                            setProfitData({
                              ...profitData,
                              ProfitLoss: {
                                ...profitData.ProfitLoss,
                                CurrentProfitWithCumulativeLoss: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                    </div>

                  </div>

                </div>
              );


     if (activeTab === "emp")
          return (
            <div className="max-w-5xl space-y-5 text-sm">
              <div className="flex items-center">
                    <Label className="w-64">SDS Code</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={sdsCode}
                      readOnly
                    />
                  </div>

                  {/* Date */}
                <div className="flex items-center">
                  <Label className="w-64">Date</Label>
                  <Input
                    type="date"
                    className="w-44 h-8 rounded-none"
                    value={reportDate}
                    onChange={(e) =>
                      setReportDate(e.target.value)
                    }
                  />
                </div>

              <div className="flex items-center">
                <Label className="w-64">Approved Cadre Strength</Label>
                <Input
                  className="w-32 h-8 rounded-none"
                  value={empdata.ApprovedCadreStrength}
                  onChange={(e) =>
                    setEmpData({
                      ...empdata,
                      ApprovedCadreStrength: e.target.value
                    })
                  }
                />
              </div>

              <div className="flex items-center">
                <Label className="w-64">Filled</Label>
                <Input
                  className="w-32 h-8 rounded-none"
                  value={empdata.Filled}
                  onChange={(e) =>
                    setEmpData({
                      ...empdata,
                      Filled: e.target.value
                    })
                  }
                />
              </div>

              <div className="flex items-center">
                <Label className="w-64">Vacant</Label>
                <Input
                  className="w-32 h-8 rounded-none"
                  value={empdata.Vacant}
                  onChange={(e) =>
                    setEmpData({
                      ...empdata,
                      Vacant: e.target.value
                    })
                  }
                />
              </div>

            </div>
          );


    if (activeTab === "safety")
            return (
              <div className="max-w-5xl space-y-4 text-sm">
                <div className="flex items-center">
                    <Label className="w-64">SDS Code</Label>
                    <Input
                      className="w-32 h-8 rounded-none"
                      value={sdsCode}
                      readOnly
                    />
                  </div>

                    {/* Date */}
                <div className="flex items-center">
                  <Label className="w-64">Date</Label>
                  <Input
                    type="date"
                    className="w-44 h-8 rounded-none"
                    value={reportDate}
                    onChange={(e) =>
                      setReportDate(e.target.value)
                    }
                  />
                </div>

                {Object.keys(safetyData)
                  .filter(key => key !== "SDSCode" && key !== "Date")
                  .map((key) => {
                  const labelText = key.replace(/([A-Z])/g, ' $1').trim();

                  return (
                    <div className="flex items-center" key={key}>
                      <Label className="w-64">{labelText}</Label>

                      <Select
                        value={safetyData[key as keyof typeof safetyData] || ""}
                        onValueChange={(val: string) =>
                          setSafetyData({
                            ...safetyData,
                            [key]: val // Type-safe assignment
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-8 rounded-none">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}

              </div>
            );


    return null
  }

  return (
    <>
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Fill Data Report</h1>

      <div className="flex items-end gap-4">
        <div>
          <Label>From Date</Label>
          <Input type="date"
            value={Fromdate}
            onChange={(e)=>setFromdate(e.target.value)}/>
        </div>

        <Button onClick={handleGetData} disabled={loading}>
          {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
          Get Data
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">{progress}</p>}

      <div className="flex gap-2 flex-wrap">
        {["branch","emp","member","deposit","loan","jewel","npa","profit","safety"]
          .map(tab=>(
            <Button key={tab}
              variant={activeTab===tab?"default":"outline"}
              size="sm"
              onClick={()=>setActiveTab(tab)}>
              {tab.toUpperCase()}
            </Button>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTabContent()}
        </CardContent>
      </Card>
     <Button
            className="w-full"
            disabled={loading}
            onClick={() => {
              setPreviewStep(0)
              setShowPreview(true)
            }}
          >
            Preview & Submit
      </Button>
    </div>
    {showPreview && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <div className="bg-white w-[90%] max-h-[90%] overflow-y-auto p-6 rounded">

                <h2 className="text-xl font-bold mb-4">
                  Preview ({previewStep + 1}/9)
                </h2>

                {/* STEP CONTENT */}
                {previewStep === 0 && (
                  <PreviewTableWithColumns
                    title="Branch"
                    data={fetchedData.branch}
                    columns={columnOrders.branch}
                  />
                )}

                {previewStep === 1 && (
                  <PreviewTableWithColumns
                    title="Members"
                    data={fetchedData.member}
                    columns={columnOrders.member}
                  />
                )}

                {previewStep === 2 && (
                  <PreviewTableWithColumns
                    title="Deposits"
                    data={fetchedData.deposit}
                    columns={columnOrders.deposit}
                  />
                )}

                {previewStep === 3 && (
                  <PreviewTableWithColumns
                    title="Loans"
                    data={fetchedData.loan}
                    columns={columnOrders.loan}
                  />
                )}

                {previewStep === 4 && (
                  <PreviewTableWithColumns
                    title="Jewel"
                    data={fetchedData.jewel}
                    columns={columnOrders.jewel}
                  />
                )}
                {previewStep === 5 && (
                  <PreviewKeyValue
                    title="NPA"
                    fields={NPA_FIELDS}
                    data={npaData}
                  />
                )}

                {previewStep === 6 && (
                  <PreviewKeyValue
                    title="Profit"
                    fields={PROFIT_FIELDS}
                    data={profitData}
                  />
                )}

                {previewStep === 7 && (
                  <PreviewKeyValue
                    title="Employee"
                    fields={EMP_FIELDS}
                    data={empdata}
                  />
                )}

                {previewStep === 8 && (
                  <PreviewKeyValue
                    title="Safety"
                    fields={SAFETY_FIELDS}
                    data={safetyData}
                  />
                )}



                {/* ACTIONS */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      previewStep === 0
                        ? setShowPreview(false)
                        : setPreviewStep(p => p - 1)
                    }
                  >
                    Back
                  </Button>

                  {previewStep < 8 ? (
                    <Button onClick={() => setPreviewStep(p => p + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={handlePreviewOk}>
                      OK & Submit
                    </Button>
                  )}
                </div>

              </div>
            </div>
          )}
  </>
  )
}
