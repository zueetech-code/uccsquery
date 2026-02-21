"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase-client"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

type UserType = {
  id: string
  email: string
  role: string
  active: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [open, setOpen] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("agent")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const snap = await getDocs(collection(db, "users"))
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserType[]
    setUsers(list)
  }

  // Create User Function
  async function handleCreate() {
    try {
      setLoading(true)

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error)
        return
      }

      // ✅ Show success message
      alert(`User ${email} created successfully!`)

      setEmail("")
      setPassword("")
      setRole("agent")
      setOpen(false)
      loadUsers()
    } catch (err) {
      alert("Error creating user")
    } finally {
      setLoading(false)
    }
  }

  // Toggle active/inactive status
  async function toggleActive(user: UserType) {
    try {
      const ref = doc(db, "users", user.id)
      await updateDoc(ref, { active: !user.active })
      alert(`User ${user.email} is now ${user.active ? "inactive" : "active"}`)
      loadUsers()
    } catch (err) {
      alert("Failed to update user status")
    }
  }

  // Delete user
  async function deleteUser(user: UserType) {
    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error)
        return
      }

      alert(`User ${user.email} deleted successfully!`)
      loadUsers()
    } catch (err) {
      alert("Failed to delete user")
    }
  }

  // Update role for existing users
  async function updateUserRole(user: UserType, newRole: string) {
    try {
      const ref = doc(db, "users", user.id)
      await updateDoc(ref, { role: newRole })
      alert(`User role updated to ${newRole}`)
      loadUsers()
    } catch (err) {
      alert("Failed to update user role")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>

        {/* Create User Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="User Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="ercs">ERCS</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center border p-3 rounded-lg"
          >
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-gray-500">
                Role: {user.role} | {user.active ? "Active" : "Inactive"}
              </p>
              {/* Add ability to change role for users */}
              <Select
                value={user.role}
                onValueChange={(newRole) => updateUserRole(user, newRole)}
                className="w-32"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="ercs">ERCS</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={user.active ? "destructive" : "default"}
                onClick={() => toggleActive(user)}
              >
                {user.active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteUser(user)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
