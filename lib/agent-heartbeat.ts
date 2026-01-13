"use client"

import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore"
import type { Client } from "@/types"

const db = getFirestore()

/**
 * One-time fetch (initial load)
 */
export async function attachLastSeen(clients: Client[]): Promise<Client[]> {
  return Promise.all(
    clients.map(async (client) => {
      if (!client.id) return client

      try {
        const ref = doc(db, "agent_heartbeats", client.id)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          return {
            ...client,
            lastSeen: null,
            heartbeatStatus: "offline",
          }
        }

        const data = snap.data()

        return {
          ...client,
          lastSeen: data.lastSeen ?? null,
          heartbeatStatus: data.status ?? "offline",
        }
      } catch {
        return {
          ...client,
          lastSeen: null,
          heartbeatStatus: "offline",
        }
      }
    })
  )
}


/**
 * Real-time listener
 */
export function subscribeLastSeen(
  clientId: string,
  onUpdate: (data: { lastSeen: any; heartbeatStatus: string }) => void
) {
  const ref = doc(db, "agent_heartbeats", clientId)

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onUpdate({
        lastSeen: null,
        heartbeatStatus: "offline",
      })
      return
    }

    const data = snap.data()

    onUpdate({
      lastSeen: data.lastSeen ?? null,
      heartbeatStatus: data.status ?? "offline",
    })
  })
}

