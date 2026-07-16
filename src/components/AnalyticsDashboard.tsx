import React, { useState, useMemo } from "react"
import { useMguDb } from "@/lib/db"
import type { JobCategory } from "@/lib/types"
import {
  getBillingCycleDates,
  formatDateKey,
  formatIndianRupees,
} from "@/lib/payrollUtils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  LabelList,
  PolarGrid,
} from "recharts"
import {
  RiGroupLine,
  RiTimeLine,
  RiMoneyRupeeCircleLine,
  RiCalendarEventLine,
  RiPieChartLine,
  RiBarChartLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
} from "@remixicon/react"

const CATEGORY_COLORS: Record<JobCategory, string> = {
  Gardeners: "var(--chart-1)",
  Drivers: "var(--chart-2)",
  Cooks: "var(--chart-3)",
  Helpers: "var(--chart-4)",
}

export const AnalyticsDashboard: React.FC = () => {
  const { employees, contracts, attendance, settings, calculatePayroll } =
    useMguDb()

  // Date selectors (default to July 2026 to match current workspace default)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(7)
  const [profileMetric, setProfileMetric] = useState<"Avg Work Days" | "Avg Overtime Days" | "Avg Pay (k₹)">("Avg Pay (k₹)")
  const [activeTrendMetric, setActiveTrendMetric] = useState<"totalPay" | "regularPay" | "otPay">("totalPay")

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = [currentYear - 1, currentYear, currentYear + 1]

  // Calculate dates of selected billing cycle
  const billingCycleDates = useMemo(() => {
    return getBillingCycleDates(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const cycleDateRangeStr = useMemo(() => {
    if (billingCycleDates.length === 0) return ""
    const startStr = new Date(
      formatDateKey(billingCycleDates[0])
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })
    const endStr = new Date(
      formatDateKey(billingCycleDates[billingCycleDates.length - 1])
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${startStr} - ${endStr}`
  }, [billingCycleDates])

  // Selected Month Payroll Data
  const payrollData = useMemo(() => {
    return calculatePayroll(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, employees, contracts, attendance, settings])

  // Past 6 Months Disbursement Trend Calculation
  const historicalTrendData = useMemo(() => {
    // Generate list of past 6 months including selected month
    const pastMonths: { year: number; month: number }[] = []
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i
      let y = selectedYear
      while (m <= 0) {
        m += 12
        y -= 1
      }
      pastMonths.push({ year: y, month: m })
    }

    return pastMonths.map(({ year, month }) => {
      const data = calculatePayroll(year, month)
      const totalRegularPay = data.reduce((sum, r) => sum + r.regularPay, 0)
      const totalOtPay = data.reduce((sum, r) => sum + r.otPay, 0)
      const totalDisbursement = data.reduce((sum, r) => sum + r.totalPay, 0)

      const monthObj = months.find((m) => m.value === month)
      const monthLabel = monthObj
        ? `${monthObj.label.substring(0, 3)} ${String(year).substring(2)}`
        : ""

      return {
        month: monthLabel,
        "Regular Pay": totalRegularPay,
        "Overtime Pay": totalOtPay,
        "Total Pay": totalDisbursement,
        disbursement: totalDisbursement,
        totalPay: totalDisbursement,
        regularPay: totalRegularPay,
        otPay: totalOtPay,
      }
    })
  }, [selectedYear, selectedMonth, employees, contracts, attendance, settings])

  // Calculate dynamic metrics for trend footer based on selected metric
  const trendMetrics = useMemo(() => {
    if (historicalTrendData.length < 2) {
      return { percentageChangeStr: "up by 0.0%", sixMonthRangeStr: "", isUp: true }
    }
    const prevMonthData = historicalTrendData[historicalTrendData.length - 2]
    const currentMonthData = historicalTrendData[historicalTrendData.length - 1]

    const prevPay = prevMonthData[activeTrendMetric] || 0
    const currentPay = currentMonthData[activeTrendMetric] || 0

    let percent = 0
    if (prevPay > 0) {
      percent = ((currentPay - prevPay) / prevPay) * 100
    } else if (currentPay > 0) {
      percent = 100
    }

    const direction = percent >= 0 ? "up" : "down"
    const percentageChangeStr = `${direction} by ${Math.abs(percent).toFixed(1)}%`

    const firstMonth = historicalTrendData[0]?.month || ""
    const lastMonth = historicalTrendData[historicalTrendData.length - 1]?.month || ""
    const sixMonthRangeStr = `${firstMonth} - ${lastMonth}`

    return {
      percentageChangeStr,
      sixMonthRangeStr,
      isUp: percent >= 0,
    }
  }, [historicalTrendData, activeTrendMetric])

  const trendTotals = useMemo(() => {
    return {
      totalPay: historicalTrendData.reduce((sum, item) => sum + item.totalPay, 0),
      regularPay: historicalTrendData.reduce((sum, item) => sum + item.regularPay, 0),
      otPay: historicalTrendData.reduce((sum, item) => sum + item.otPay, 0),
    }
  }, [historicalTrendData])

  // Aggregate stats for current month
  const activeStaffCount = payrollData.length

  const totalWages = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.totalPay, 0)
  }, [payrollData])

  const regularDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.regularDays, 0)
  }, [payrollData])

  const overtimeDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.otDays, 0)
  }, [payrollData])

  // Chart 1: Expenditure by Category
  const categoryPayrollData = useMemo(() => {
    const categories: JobCategory[] = [
      "Gardeners",
      "Drivers",
      "Cooks",
      "Helpers",
    ]
    return categories.map((cat) => {
      const catRows = payrollData.filter((r) => r.category === cat)
      const total = catRows.reduce((sum, r) => sum + r.totalPay, 0)
      return {
        category: cat,
        amount: total,
        fill: CATEGORY_COLORS[cat],
      }
    })
  }, [payrollData])

  // Chart 2: Workforce Composition (Pie)
  const categoryDistributionData = useMemo(() => {
    const categories: JobCategory[] = [
      "Gardeners",
      "Drivers",
      "Cooks",
      "Helpers",
    ]
    const distribution = categories
      .map((cat) => {
        const count = employees.filter((e) => e.category === cat).length
        return {
          name: cat,
          value: count,
          fill: CATEGORY_COLORS[cat],
        }
      })
      .filter((d) => d.value > 0)

    return distribution
  }, [employees])

  // Chart 3: Category Performance Radar
  const radarData = useMemo(() => {
    const categories: JobCategory[] = [
      "Gardeners",
      "Drivers",
      "Cooks",
      "Helpers",
    ]
    return categories.map((cat) => {
      const catRows = payrollData.filter((r) => r.category === cat)
      const count = catRows.length

      const avgRegularDays =
        count > 0
          ? catRows.reduce((sum, r) => sum + r.regularDays, 0) / count
          : 0
      const avgOtDays =
        count > 0 ? catRows.reduce((sum, r) => sum + r.otDays, 0) / count : 0
      const avgPayK =
        count > 0
          ? catRows.reduce((sum, r) => sum + r.totalPay, 0) / count / 1000
          : 0

      return {
        category: cat,
        "Avg Work Days": parseFloat(avgRegularDays.toFixed(1)),
        "Avg Overtime Days": parseFloat(avgOtDays.toFixed(1)),
        "Avg Pay (k₹)": parseFloat(avgPayK.toFixed(1)),
      }
    })
  }, [payrollData])

  const radialChartData = useMemo(() => {
    return radarData.map((d) => ({
      category: d.category,
      value: d[profileMetric],
      fill: `var(--color-${d.category})`,
    }))
  }, [radarData, profileMetric])

  const highestCategoryMetric = useMemo(() => {
    if (radialChartData.length === 0) return { category: "None", value: 0 }
    let highest = radialChartData[0]
    for (const d of radialChartData) {
      if (d.value > highest.value) {
        highest = d
      }
    }
    return highest
  }, [radialChartData])

  const trendChartConfig = {
    totalPay: {
      label: "Total Pay",
      color: "var(--chart-1)",
    },
    regularPay: {
      label: "Regular Pay",
      color: "var(--chart-2)",
    },
    otPay: {
      label: "Overtime Pay",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig

  const categoryBarConfig = {
    amount: {
      label: "Total Expenses",
      color: "var(--chart-1)",
    },
  }

  const distributionPieConfig = {
    value: {
      label: "Active Employees",
    },
  }

  const radialChartConfig = {
    value: {
      label: profileMetric,
    },
    Gardeners: {
      label: "Gardeners",
      color: "var(--chart-1)",
    },
    Drivers: {
      label: "Drivers",
      color: "var(--chart-2)",
    },
    Cooks: {
      label: "Cooks",
      color: "var(--chart-3)",
    },
    Helpers: {
      label: "Helpers",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig

  const hasData = employees.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight md:text-2xl">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              View statistical reports and trends
            </p>
          </div>
        </div>
        <Card className="flex min-h-[400px] flex-col items-center justify-center p-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Data Available</EmptyTitle>
              <EmptyDescription>
                Register employees and create contracts first to visualize
                statistics.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* FILTER BAR */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/85 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight md:text-2xl">
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Disbursement cycle statistics for{" "}
            <span className="font-semibold text-foreground">
              {cycleDateRangeStr}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <RiCalendarEventLine className="size-4" />
            <span>Cycle:</span>
          </div>

          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => val && setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => val && setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="group relative overflow-hidden border-border/80 hover:border-foreground/10 hover:shadow-md hover:shadow-foreground/[0.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Total Salaries Paid
            </span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary group-hover:scale-105 transition-transform">
              <RiMoneyRupeeCircleLine className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="truncate font-heading text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
              {formatIndianRupees(totalWages)}
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-muted-foreground/80">
              <span>Current cycle disbursement</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="group relative overflow-hidden border-border/80 hover:border-foreground/10 hover:shadow-md hover:shadow-foreground/[0.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Paid Employees
            </span>
            <div className="rounded-lg bg-chart-2/10 p-1.5 text-chart-2 group-hover:scale-105 transition-transform">
              <RiGroupLine className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {activeStaffCount}{" "}
              <span className="font-sans text-xs font-normal text-muted-foreground uppercase tracking-wider">
                / {employees.length} Total
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-muted-foreground/80">
              <span>Active payroll records</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="group relative overflow-hidden border-border/80 hover:border-foreground/10 hover:shadow-md hover:shadow-foreground/[0.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Regular Workdays
            </span>
            <div className="rounded-lg bg-chart-3/10 p-1.5 text-chart-3 group-hover:scale-105 transition-transform">
              <RiCalendarEventLine className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {regularDaysLogged.toFixed(1)}{" "}
              <span className="font-sans text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-muted-foreground/80">
              <span>Total attendance days logged</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="group relative overflow-hidden border-border/80 hover:border-foreground/10 hover:shadow-md hover:shadow-foreground/[0.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Overtime Logged
            </span>
            <div className="rounded-lg bg-chart-4/10 p-1.5 text-chart-4 group-hover:scale-105 transition-transform">
              <RiTimeLine className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {overtimeDaysLogged}{" "}
              <span className="font-sans text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Duties
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-muted-foreground/80">
              <span>Eligible staff categories</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CHART 1: Disbursement Trend Over Time (Area Chart) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-8">
          <CardHeader className="flex flex-col items-stretch border-b border-border/85 p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
              <CardTitle className="font-heading text-sm font-bold tracking-wide uppercase">
                Disbursement History Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Interactive trend view for the last 6 months
              </CardDescription>
            </div>
            <div className="flex border-t border-border/85 sm:border-t-0">
              {(["totalPay", "regularPay", "otPay"] as const).map((key) => {
                const isActive = activeTrendMetric === key
                return (
                  <button
                    key={key}
                    data-active={isActive}
                    onClick={() => setActiveTrendMetric(key)}
                    className="flex flex-1 flex-col justify-center gap-1 border-r border-border/85 last:border-r-0 px-6 py-3 text-left data-[active=true]:bg-muted/40 transition-colors sm:px-8 sm:py-4 select-none cursor-pointer"
                  >
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      {trendChartConfig[key].label}
                    </span>
                    <span className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-2xl tabular-nums">
                      {formatIndianRupees(trendTotals[key])}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px] flex-1 pt-6">
            <ChartContainer
              config={trendChartConfig}
              className="h-full min-h-[280px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={historicalTrendData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="disbursementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${activeTrendMetric})`} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={`var(--color-${activeTrendMetric})`} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" className="stroke-border/30" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="font-mono text-[10px] fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    `₹${val >= 1000 ? val / 1000 + "k" : val}`
                  }
                  dx={-10}
                  className="font-mono text-[10px] fill-muted-foreground"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey={activeTrendMetric}
                  type="natural"
                  fill="url(#disbursementGradient)"
                  fillOpacity={1}
                  stroke={`var(--color-${activeTrendMetric})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="pt-0 pb-6">
            <div className="flex w-full items-start gap-2 text-xs">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 leading-none font-semibold text-foreground">
                  Trending {trendMetrics.percentageChangeStr} this month{" "}
                  {trendMetrics.isUp ? (
                    <RiArrowRightUpLine className="size-4 text-emerald-500 animate-pulse" />
                  ) : (
                    <RiArrowRightDownLine className="size-4 text-rose-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  {trendMetrics.sixMonthRangeStr}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* CHART 2: Workforce Composition (Pie/Donut Chart) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-4">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <RiPieChartLine className="size-4 text-chart-2" />
              <CardTitle className="font-heading text-sm font-bold tracking-wide uppercase">
                Workforce Distribution
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Breakdown of registered employees by job category
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[300px] flex-1 flex-col items-center justify-center pt-0">
            <div className="relative h-[220px] w-full flex items-center justify-center">
              <ChartContainer
                config={distributionPieConfig}
                className="h-full w-full"
              >
                <PieChart>
                  <Pie
                    data={categoryDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        labelKey="name"
                        hideLabel
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              {/* Central Donut Text */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-heading text-3xl font-extrabold text-foreground tracking-tight leading-none">
                  {employees.length}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mt-0.5">
                  Staff
                </span>
              </div>
            </div>

            {/* Legend breakdown lists */}
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
              {categoryDistributionData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="font-medium text-muted-foreground truncate">
                    {entry.name}
                  </span>
                  <span className="ml-auto font-mono font-bold text-foreground">
                    {entry.value}
                  </span>
                </div>
              ))}
              {categoryDistributionData.length === 0 && (
                <span className="col-span-2 text-center text-xs text-muted-foreground">
                  No employees found
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOWER GRID SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CHART 3: Disbursement by Category (Bar Chart) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <RiBarChartLine className="size-4 text-chart-3" />
              <CardTitle className="font-heading text-sm font-bold tracking-wide uppercase">
                Disbursements by Category
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Salary expenses distribution across job roles in this billing
              cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex-1 pt-0">
            {payrollData.length === 0 ? (
              <div className="flex h-full min-h-[250px] items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  No payroll calculated for this month
                </span>
              </div>
            ) : (
              <ChartContainer
                config={categoryBarConfig}
                className="h-full min-h-[280px] w-full"
              >
                <BarChart
                  data={categoryPayrollData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="stroke-border/30" />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    className="font-mono text-[10px]"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      `₹${val >= 1000 ? val / 1000 + "k" : val}`
                    }
                    dx={-10}
                    className="font-mono text-[10px]"
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {categoryPayrollData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* CHART 4: Category Profile metrics (Radial Chart) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RiBarChartLine className="size-4 text-amber-500" />
                <CardTitle className="font-heading text-sm font-bold tracking-wide uppercase">
                  Category Profiles
                </CardTitle>
              </div>
              <Select
                value={profileMetric}
                onValueChange={(val) =>
                  setProfileMetric(
                    val as "Avg Work Days" | "Avg Overtime Days" | "Avg Pay (k₹)"
                  )
                }
              >
                <SelectTrigger className="h-7 w-[165px] text-xs">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avg Pay (k₹)">Avg Pay (k₹)</SelectItem>
                  <SelectItem value="Avg Work Days">Avg Work Days</SelectItem>
                  <SelectItem value="Avg Overtime Days">Avg Overtime Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription className="text-xs">
              Performance metrics (average working days, overtime, and pay) per staff type
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[300px] flex-1 flex-col items-center justify-center pt-0">
            {payrollData.length === 0 ? (
              <div className="flex h-full min-h-[250px] items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  No active profile metrics for this month
                </span>
              </div>
            ) : (
              <ChartContainer
                config={radialChartConfig}
                className="mx-auto aspect-square h-[250px] w-full"
              >
                <RadialBarChart
                  data={radialChartData}
                  startAngle={-90}
                  endAngle={380}
                  innerRadius={30}
                  outerRadius={110}
                >
                  <PolarGrid gridType="circle" radialLines={false} stroke="var(--border)" className="stroke-border/30" />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        nameKey="category"
                        formatter={(value, _, item) => (
                          <>
                            <div
                              className="shrink-0 rounded-[2px] h-2.5 w-2.5"
                              style={{
                                backgroundColor: item.color || item.payload?.fill,
                              }}
                            />
                            <div className="flex flex-1 justify-between leading-none items-center">
                              <span className="text-muted-foreground mr-4">
                                {radialChartConfig[
                                  item.payload.category as keyof typeof radialChartConfig
                                ]?.label ?? item.payload.category}
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {profileMetric === "Avg Pay (k₹)"
                                  ? `₹${value}k`
                                  : `${value} days`}
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <RadialBar dataKey="value" background>
                    <LabelList
                      position="insideStart"
                      dataKey="category"
                      className="fill-white capitalize mix-blend-luminosity font-bold font-mono text-[9px] tracking-tight"
                    />
                  </RadialBar>
                </RadialBarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="pt-0 pb-6 flex-col gap-1 items-start">
            <div className="flex w-full items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs font-medium leading-none text-foreground">
              <span className="font-semibold text-primary">{highestCategoryMetric.category}</span>
              <span className="text-muted-foreground">leads {profileMetric.toLowerCase()} with</span>
              <span className="font-bold text-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border/50">
                {profileMetric === "Avg Pay (k₹)"
                  ? `₹${highestCategoryMetric.value}k`
                  : `${highestCategoryMetric.value} days`}
              </span>
              <RiArrowRightUpLine className="size-4 text-emerald-500 ml-auto shrink-0 animate-pulse" />
            </div>
            <div className="text-[9px] font-mono tracking-wider uppercase text-muted-foreground/75 mt-2">
              Metrics based on: {cycleDateRangeStr || "Current Cycle"}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
