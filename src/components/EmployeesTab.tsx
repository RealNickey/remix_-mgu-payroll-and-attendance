import { useState, useMemo, FormEvent } from 'react';
import { useStore, EmployeeCategory } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { 
  Edit,
  UserPlus, 
  Users, 
  Trash2, 
  Search, 
  CreditCard, 
  Tag, 
  HeartHandshake,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EmployeesTab() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, contracts } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EmployeeCategory>('Gardeners');
  const [bankAccount, setBankAccount] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<EmployeeCategory>('Gardeners');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !bankAccount || !address || !phone) return;
    if (!/^\d{10}$/.test(phone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    
    addEmployee({ name, category, bankAccount, address, phone });
    setName('');
    setBankAccount('');
    setAddress('');
    setPhone('');
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editName || !editBankAccount || !editAddress || !editPhone) return;
    if (!/^\d{10}$/.test(editPhone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    updateEmployee(editingEmployee.id, { name: editName, category: editCategory, bankAccount: editBankAccount, address: editAddress, phone: editPhone });
    setIsEditDialogOpen(false);
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchQuery = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.bankAccount.includes(searchQuery);
      return matchQuery;
    });
  }, [employees, searchQuery]);

  // Categories helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Gardeners': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Drivers': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cooks': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Helpers': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAvatarBg = (cat: string) => {
    switch (cat) {
      case 'Gardeners': return 'bg-teal-600';
      case 'Drivers': return 'bg-purple-600';
      case 'Cooks': return 'bg-amber-600';
      case 'Helpers': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Top Title/Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Employee Profiles</h2>
            <p className="text-[11px] font-medium text-slate-500">Manage institutional profiles, job roles, and bank details</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200/40">
          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Directory</span>
            <span className="text-sm font-mono font-bold text-slate-800">{employees.length} Employee{employees.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-0">
        {/* Left Column: Form Panel */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Employee</h3>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Sri. Ramesh Kumar" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="rounded-xl h-9.5 text-xs border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500" 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Category</Label>
              <Select value={category} onValueChange={(v: EmployeeCategory) => setCategory(v)}>
                <SelectTrigger id="category" className="rounded-xl h-9.5 text-xs border-slate-200 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Gardeners" className="text-xs rounded-lg">Gardeners</SelectItem>
                  <SelectItem value="Drivers" className="text-xs rounded-lg">Drivers</SelectItem>
                  <SelectItem value="Cooks" className="text-xs rounded-lg">Cooks</SelectItem>
                  <SelectItem value="Helpers" className="text-xs rounded-lg">Helpers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</Label>
              <Input id="address" placeholder="e.g. 123 Main St" value={address} onChange={e => setAddress(e.target.value)} required className="rounded-xl h-9.5 text-xs border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone (10 Digits)</Label>
              <Input id="phone" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} required pattern="\d{10}" title="Phone number must be exactly 10 digits" className="rounded-xl h-9.5 text-xs border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Account Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="bank" 
                  placeholder="e.g. SBI 1029384756" 
                  value={bankAccount} 
                  onChange={e => setBankAccount(e.target.value)} 
                  required 
                  className="rounded-xl h-9.5 pl-9 text-xs font-mono border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500" 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9.5 text-xs font-bold shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              Add Employee Profile
            </Button>
          </form>
        </div>

        {/* Right Column: Directory List */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
          {/* Header Search Filter */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Directory</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 z-10" />
              <Input
                type="text"
                placeholder="Search name, category, or account…"
                className="pl-9 rounded-xl text-xs border-slate-200 h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Container */}
          <ScrollArea className="flex-1 min-h-0">
            <Table className="w-full border-collapse">
              <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                <TableRow className="bg-white border-b border-slate-200/60">
                  <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-left w-[220px]">Employee</TableHead>
                  <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-left w-[150px]">Job Role</TableHead>
                  <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-left">Bank Account Info</TableHead>
                  <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-12">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-medium">No matching employee records found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map(emp => {
                    const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const empContractsCount = contracts.filter(c => c.employeeId === emp.id).length;

                    return (
                      <TableRow key={emp.id} className="border-t border-slate-100 bg-white hover:bg-slate-50/50">
                        <TableCell className="p-3 border-r border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-lg shrink-0">
                              <AvatarFallback className={`rounded-lg text-[10px] font-bold text-white ${getAvatarBg(emp.category)}`}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-xs truncate">{emp.name}</p>
                              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-400 font-medium">
                                <HeartHandshake className="w-3 h-3 text-slate-300" /> 
                                <span>{empContractsCount} Contract{empContractsCount !== 1 ? 's' : ''} registered</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 border-r border-slate-100">
                          <Badge variant="outline" className={`text-[10px] font-bold ${getCategoryColor(emp.category)}`}>
                            {emp.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3 border-r border-slate-100">
                          <div className="flex flex-col text-slate-700 gap-0.5">
                            <span className="font-mono text-xs font-semibold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400" /> {emp.bankAccount}</span>
                            <span className="text-xs text-slate-500">{emp.address}</span>
                            <span className="text-xs text-slate-500">{emp.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen && editingEmployee?.id === emp.id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (open) {
                              setEditingEmployee(emp);
                              setEditName(emp.name);
                              setEditCategory(emp.category);
                              setEditBankAccount(emp.bankAccount);
                              setEditAddress(emp.address || '');
                              setEditPhone(emp.phone || '');
                            } else {
                              setEditingEmployee(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-[11px] font-bold cursor-pointer transition-all h-8">
                                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Employee</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                  <Label htmlFor="edit-name" className="text-xs font-bold text-slate-700">Name</Label>
                                  <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} required className="rounded-xl h-9.5 text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="edit-category" className="text-xs font-bold text-slate-700">Category</Label>
                                  <Select value={editCategory} onValueChange={(v: EmployeeCategory) => setEditCategory(v)}>
                                    <SelectTrigger id="edit-category" className="rounded-xl h-9.5 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Gardeners" className="text-xs">Gardeners</SelectItem>
                                      <SelectItem value="Drivers" className="text-xs">Drivers</SelectItem>
                                      <SelectItem value="Cooks" className="text-xs">Cooks</SelectItem>
                                      <SelectItem value="Helpers" className="text-xs">Helpers</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="edit-bank" className="text-xs font-bold text-slate-700">Bank Account</Label>
                                  <Input id="edit-bank" value={editBankAccount} onChange={e => setEditBankAccount(e.target.value)} required className="rounded-xl h-9.5 text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="edit-address" className="text-xs font-bold text-slate-700">Address</Label>
                                  <Input id="edit-address" value={editAddress} onChange={e => setEditAddress(e.target.value)} required className="rounded-xl h-9.5 text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700">Phone (10 Digits)</Label>
                                  <Input id="edit-phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} required pattern="\d{10}" title="Phone number must be exactly 10 digits" className="rounded-xl h-9.5 text-xs" />
                                </div>
                                <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-9.5 text-xs font-bold">Save Changes</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-[11px] font-bold cursor-pointer transition-all h-8"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Employee Profile?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the profile of <strong>{emp.name}</strong>? This will permanently remove their records, and any associated contracts will be orphaned. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteEmployee(emp.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white border-none"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
