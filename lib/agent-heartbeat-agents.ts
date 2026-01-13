"use client"

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore"

import { db } from "@/lib/firebase-client"
import type { Agent } from "@/types"

/**
 * Initial load
 */
export async function attachAgentHeartbeat(
  agents: Agent[]
): Promise<Agent[]> {
  return Promise.all(
    agents.map(async (agent) => {
      try {
        const q = query(
          collection(db, "agent_heartbeats"),
          where("agentUid", "==", agent.uid)
        )

        const snap = await getDocs(q)

        if (snap.empty) {
          return {
            ...agent,
            lastLogin: null,
            heartbeatStatus: "offline",
          }
        }

        const data = snap.docs[0].data()

        return {
          ...agent,
          lastLogin: data.lastSeen ?? null,
          heartbeatStatus: data.status ?? "offline",
        }
      } catch {
        return {
          ...agent,
          lastLogin: null,
          heartbeatStatus: "offline",
        }
      }
    })
  )
}


/**
 * Realtime
 */
export function subscribeAgentHeartbeat(
  agentUid: string,
  onUpdate: (data: { lastLogin: any; heartbeatStatus: string }) => void
) {
  const q = query(
    collection(db, "agent_heartbeats"),
    where("agentUid", "==", agentUid)
  )

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      onUpdate({
        lastLogin: null,
        heartbeatStatus: "offline",
      })
      return
    }

    const data = snap.docs[0].data()

    onUpdate({
      lastLogin: data.lastSeen ?? null,
      heartbeatStatus: data.status ?? "offline",
    })
  })
}

