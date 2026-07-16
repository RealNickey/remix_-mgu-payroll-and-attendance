import { useState, useEffect } from 'react';
import { useMguDb } from '@/lib/db';
import { getContractStatus, computeEndDate } from '@/lib/payrollUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RiFilePaperLine, RiFileAddLine, RiSearchLine, RiFileList3Line, RiAlertLine } from '@remixicon/react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';

interface ContractManagementProps {
  onNavigateToEmployees: () => void;
}

export const ContractManagement = ({ onNavigateToEmployees }: ContractManagementProps) => {
  const { employees, contracts, addContract, voidContract, saveContracts } = useMguDb();

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [goNumber, setGoNumber] = useState('');
  const [goDate, setGoDate] = useState('');
  const [computedEnd, setComputedEnd] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Validation
  const [empError, setEmpError] = useState(false);
  const [startError, setStartError] = useState(false);
  const [goError, setGoError] = useState(false);
  const [goDateError, setGoDateError] = useState(false);

  // Compute end date when start date changes
  useEffect(() => {
    if (startDate) {
      setComputedEnd(computeEndDate(startDate));
    } else {
      setComputedEnd('');
    }
  }, [startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!employeeId) {
      setEmpError(true);
      hasError = true;
    } else {
      setEmpError(false);
    }

    if (!startDate) {
      setStartError(true);
      hasError = true;
    } else {
      setStartError(false);
    }

    if (!goNumber.trim()) {
      setGoError(true);
      hasError = true;
    } else {
      setGoError(false);
    }

    if (!goDate) {
      setGoDateError(true);
      hasError = true;
    } else {
      setGoDateError(false);
    }

    if (hasError) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const previousContracts = [...contracts];
    addContract(employeeId, startDate, goNumber.trim(), goDate);
    const emp = employees.find(e => e.id === employeeId);
    toast.success(`Service contract issued for ${emp?.name || 'employee'}.`, {
      action: {
        label: "Undo",
        onClick: () => saveContracts(previousContracts)
      }
    });

    // Reset Form
    setEmployeeId('');
    setStartDate('');
    setGoNumber('');
    setGoDate('');
    setComputedEnd('');
  };

  const handleVoid = (id: string, goNo: string) => {
    const previousContracts = [...contracts];
    voidContract(id);
    toast.success(`Contract ${goNo} has been voided.`, {
      action: {
        label: "Undo",
        onClick: () => saveContracts(previousContracts)
      }
    });
  };

  // Get employee name for a contract row
  const getEmployeeNameAndCategory = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) {
      return { name: 'Unknown Employee', category: '', initials: '?' };
    }
    return { name: emp.name, category: emp.category };
  };

  // Live status badge styling
  const getStatusBadge = (start: string, end: string) => {
    const status = getContractStatus(start, end);
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">Active</Badge>;
      case 'Upcoming':
        return <Badge className="bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20">Upcoming</Badge>;
      case 'Expired':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    const q = searchQuery.toLowerCase();
    const empDetails = getEmployeeNameAndCategory(c.employeeId);
    return (
      empDetails.name.toLowerCase().includes(q) ||
      empDetails.category.toLowerCase().includes(q) ||
      c.goNumber.toLowerCase().includes(q)
    );
  });

  // KPI calculations
  const totalContracts = contracts.length;
  const activeContractsCount = contracts.filter(c => getContractStatus(c.startDate, c.endDate) === 'Active').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Prerequisite warning: No employees */}
      {employees.length === 0 ? (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30">
          <RiAlertLine className="size-5" />
          <AlertTitle className="font-heading font-bold text-sm">No Employees Registered</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            You must register at least one employee in the system before you can issue service contracts.
            <Button
              variant="link"
              onClick={onNavigateToEmployees}
              className="text-destructive underline p-0 ml-1 h-auto font-medium align-baseline"
            >
              Go to Employee Profiles workspace.
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KPI Summary Cards */}
          <Card className="border-border/60 bg-card/40">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Contracts</p>
                <h3 className="text-3xl font-bold font-heading mt-1 font-mono">{totalContracts}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <RiFileList3Line className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/40">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Contracts</p>
                <h3 className="text-3xl font-bold font-heading mt-1 font-mono text-emerald-500">{activeContractsCount}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                <RiFilePaperLine className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {employees.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Issue Contract Panel */}
          <div className="w-full lg:w-1/3">
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
                  <RiFileAddLine className="text-primary size-5" />
                  Issue 90-Day Contract
                </CardTitle>
                <CardDescription>
                  Create a standard 90-day contract for an employee under a Government Order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FieldGroup>
                    <Field data-invalid={empError ? "true" : undefined}>
                      <FieldLabel>Select Employee</FieldLabel>
                      <Select
                        value={employeeId}
                        onValueChange={(val) => {
                          setEmployeeId(val ?? '');
                          setEmpError(false);
                        }}
                      >
                        <SelectTrigger className="w-full" aria-invalid={empError ? "true" : undefined}>
                          <SelectValue placeholder="Choose employee..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectGroup>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name} ({emp.category})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {empError && <FieldError>Employee is required.</FieldError>}
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field data-invalid={startError ? "true" : undefined}>
                        <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                        <DatePicker
                          id="startDate"
                          value={startDate}
                          onChange={(val) => {
                            setStartDate(val);
                            setStartError(false);
                          }}
                        />
                        {startError && <FieldError>Required.</FieldError>}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="endDate">End Date (Auto)</FieldLabel>
                        <Input
                          id="endDate"
                          value={computedEnd ? new Date(computedEnd).toLocaleDateString('en-GB') : ''}
                          placeholder="Calculated..."
                          readOnly
                          className="bg-muted/40 font-mono font-semibold"
                        />
                      </Field>
                    </div>

                    <Field data-invalid={goError ? "true" : undefined}>
                      <FieldLabel htmlFor="goNumber">Government Order No. (G.O.)</FieldLabel>
                      <Input
                        id="goNumber"
                        placeholder="e.g. Ad.B3/928/2026/MGU"
                        value={goNumber}
                        onChange={(e) => {
                          setGoNumber(e.target.value);
                          if (e.target.value.trim()) setGoError(false);
                        }}
                        aria-invalid={goError ? "true" : undefined}
                      />
                      {goError && <FieldError>G.O. Number is required.</FieldError>}
                    </Field>

                    <Field data-invalid={goDateError ? "true" : undefined}>
                      <FieldLabel htmlFor="goDate">Order Issue Date</FieldLabel>
                      <DatePicker
                        id="goDate"
                        value={goDate}
                        onChange={(val) => {
                          setGoDate(val);
                          setGoDateError(false);
                        }}
                      />
                      {goDateError && <FieldError>Order Issue Date is required.</FieldError>}
                    </Field>
                  </FieldGroup>

                  <Button type="submit" className="mt-2 w-full">
                    <RiFileAddLine data-icon="inline-start" />
                    Issue Contract
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Registry Table */}
          <div className="flex-1">
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
                    <RiFileList3Line className="text-primary size-5" />
                    Contract Registry
                  </CardTitle>
                  <CardDescription>
                    History and active logs of contracts.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <RiSearchLine className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Employee/G.O..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>

              <CardContent>
                {filteredContracts.length === 0 ? (
                  <div className="py-12 border border-dashed rounded-lg flex flex-col items-center justify-center">
                    <Empty>
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">No contracts found.</p>
                        {searchQuery && (
                          <p className="text-xs text-muted-foreground/80">
                            Try refining your search query.
                          </p>
                        )}
                      </div>
                    </Empty>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Contract Term</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>G.O. / Issue Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContracts.map((c) => {
                          const empInfo = getEmployeeNameAndCategory(c.employeeId);
                          const isOrphan = empInfo.name === 'Unknown Employee';
                          
                          // Format display dates
                          const startDisplay = new Date(c.startDate).toLocaleDateString('en-GB');
                          const endDisplay = new Date(c.endDate).toLocaleDateString('en-GB');
                          const goDateDisplay = new Date(c.goDate).toLocaleDateString('en-GB');

                          return (
                            <TableRow key={c.id} className="group/row">
                              <TableCell>
                                <div>
                                  <p className={`font-medium leading-tight ${isOrphan ? 'text-rose-500 italic' : 'text-foreground'}`}>
                                    {empInfo.name}
                                  </p>
                                  {!isOrphan && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{empInfo.category}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div>{startDisplay}</div>
                                <div className="text-muted-foreground">to {endDisplay}</div>
                              </TableCell>
                              <TableCell>{getStatusBadge(c.startDate, c.endDate)}</TableCell>
                              <TableCell className="text-xs">
                                <div className="font-mono">{c.goNumber}</div>
                                <div className="text-muted-foreground font-sans mt-0.5">Issued: {goDateDisplay}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger render={
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                                    >
                                      Void
                                    </Button>
                                  } />
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Void Service Contract?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm text-muted-foreground">
                                        Are you sure you want to void contract <strong className="text-foreground">{c.goNumber}</strong>?
                                        <br /><br />
                                        <span className="text-destructive font-medium">Warning:</span> Voiding this contract will affect payroll calculation for dates within its duration, as there will be no covering contract. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleVoid(c.id, c.goNumber)}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                      >
                                        Void Contract
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
