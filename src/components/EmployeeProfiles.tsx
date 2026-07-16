import { useState } from 'react';
import { useMguDb } from '@/lib/db';
import type { JobCategory } from '@/lib/types';
import { getEmployeeInitials } from '@/lib/payrollUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
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
import { RiDeleteBinLine, RiUserAddLine, RiSearchLine, RiContactsLine } from '@remixicon/react';
import { toast } from 'sonner';

export const EmployeeProfiles = () => {
  const { employees, contracts, addEmployee, deleteEmployee, saveEmployees } = useMguDb();
  
  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<JobCategory | ''>('');
  const [bankAccount, setBankAccount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Validation errors
  const [nameError, setNameError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [bankAccountError, setBankAccountError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    if (!name.trim()) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!category) {
      setCategoryError(true);
      hasError = true;
    } else {
      setCategoryError(false);
    }

    if (!bankAccount.trim()) {
      setBankAccountError(true);
      hasError = true;
    } else {
      setBankAccountError(false);
    }

    if (hasError) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const previousEmployees = [...employees];
    addEmployee(name.trim(), category as JobCategory, bankAccount.trim());
    toast.success(`Employee "${name.trim()}" registered successfully.`, {
      action: {
        label: "Undo",
        onClick: () => saveEmployees(previousEmployees)
      }
    });
    
    // Reset form
    setName('');
    setCategory('');
    setBankAccount('');
  };

  const handleDelete = (id: string, empName: string) => {
    const previousEmployees = [...employees];
    deleteEmployee(id);
    toast.success(`Employee "${empName}" has been deleted.`, {
      action: {
        label: "Undo",
        onClick: () => saveEmployees(previousEmployees)
      }
    });
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.category.toLowerCase().includes(q) ||
      emp.bankAccount.toLowerCase().includes(q)
    );
  });

  const getContractCount = (empId: string) => {
    return contracts.filter(c => c.employeeId === empId).length;
  };

  // Category Color mapping for initial bubble
  const getCategoryColor = (cat: JobCategory) => {
    switch (cat) {
      case 'Gardeners':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20';
      case 'Drivers':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20';
      case 'Cooks':
        return 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20';
      case 'Helpers':
        return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Registration Section */}
      <div className="w-full lg:w-1/3">
        <Card className="border-border/60 bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <RiUserAddLine className="text-primary size-5" />
              Register Employee
            </CardTitle>
            <CardDescription>
              Add a new contractual staff member to the portal registry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field data-invalid={nameError ? "true" : undefined}>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input
                    id="fullName"
                    placeholder="e.g. Sri. Ramesh Kumar"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    aria-invalid={nameError ? "true" : undefined}
                  />
                  {nameError && <FieldError>Full Name is required.</FieldError>}
                </Field>

                <Field data-invalid={categoryError ? "true" : undefined}>
                  <FieldLabel>Job Category</FieldLabel>
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      setCategory(val as JobCategory);
                      setCategoryError(false);
                    }}
                  >
                    <SelectTrigger className="w-full" aria-invalid={categoryError ? "true" : undefined}>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Gardeners">Gardeners</SelectItem>
                        <SelectItem value="Drivers">Drivers</SelectItem>
                        <SelectItem value="Cooks">Cooks</SelectItem>
                        <SelectItem value="Helpers">Helpers</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {categoryError && <FieldError>Job Category is required.</FieldError>}
                </Field>

                <Field data-invalid={bankAccountError ? "true" : undefined}>
                  <FieldLabel htmlFor="bankAccount">Bank Account Number</FieldLabel>
                  <Input
                    id="bankAccount"
                    placeholder="e.g. SBI-1234567890"
                    value={bankAccount}
                    onChange={(e) => {
                      setBankAccount(e.target.value);
                      if (e.target.value.trim()) setBankAccountError(false);
                    }}
                    aria-invalid={bankAccountError ? "true" : undefined}
                  />
                  {bankAccountError && <FieldError>Bank Account Number is required.</FieldError>}
                </Field>
              </FieldGroup>

              <Button type="submit" className="mt-2 w-full">
                <RiUserAddLine data-icon="inline-start" />
                Add Employee
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Directory Section */}
      <div className="flex-1">
        <Card className="border-border/60 bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
                <RiContactsLine className="text-primary size-5" />
                Employee Directory
              </CardTitle>
              <CardDescription>
                Search and manage employee records.
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-64">
              <RiSearchLine className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search directory..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredEmployees.length === 0 ? (
              <div className="py-12 border border-dashed rounded-lg flex flex-col items-center justify-center">
                <Empty>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">No employee records found.</p>
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
                      <TableHead>Employee Details</TableHead>
                      <TableHead>Job Category</TableHead>
                      <TableHead>Bank Account</TableHead>
                      <TableHead className="text-center">Active Contracts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => {
                      const initials = getEmployeeInitials(emp.name);
                      const cCount = getContractCount(emp.id);
                      
                      return (
                        <TableRow key={emp.id} className="group/row">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {/* Avatar Block */}
                              <div className={`size-9 rounded-full flex items-center justify-center text-xs font-bold font-heading ${getCategoryColor(emp.category)}`}>
                                {initials || "E"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground leading-tight">{emp.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">ID: {emp.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getCategoryColor(emp.category)} border-0 font-medium`}>
                              {emp.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{emp.bankAccount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={cCount > 0 ? "secondary" : "ghost"} className="font-semibold font-mono">
                              {cCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger render={
                                <Button
                                  variant="destructive"
                                  size="icon-xs"
                                  className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                                >
                                  <RiDeleteBinLine />
                                </Button>
                              } />
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-muted-foreground">
                                    This action will permanently delete <strong className="text-foreground">{emp.name}</strong> from the system directory.
                                    <br /><br />
                                    <span className="text-destructive font-medium">Warning:</span> Any contracts linked to this employee will become orphaned. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(emp.id, emp.name)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Delete Employee
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
  );
};
