import Avatar from "boring-avatars"
import type { Employee } from "@/lib/types"
import { cn } from "@/lib/utils"

const DESIGN_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#0ea5e9", "#a855f7"]

interface EmployeeAvatarProps {
  employee: Employee
  size?: "default" | "sm" | "lg"
  className?: string
}

export function EmployeeAvatar({
  employee,
  size = "default",
  className,
}: EmployeeAvatarProps) {
  const pixelSize = size === "sm" ? 24 : size === "lg" ? 40 : 32
  const seed = employee.avatarSeed || employee.id || employee.name

  return (
    <div
      data-slot="employee-avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/40 bg-card select-none",
        "data-[size=lg]:size-10 data-[size=sm]:size-6",
        className
      )}
    >
      <Avatar
        size={pixelSize}
        name={seed}
        variant="beam"
        colors={DESIGN_COLORS}
        square
      />
    </div>
  )
}
