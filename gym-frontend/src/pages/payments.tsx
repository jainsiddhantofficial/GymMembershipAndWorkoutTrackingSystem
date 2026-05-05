import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, getMembers, createPayment, updatePaymentStatus, deletePayment, getRevenue } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const paymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amount: z.coerce.number().min(0.01, "Amount must be > 0"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE"]),
  description: z.string().optional(),
  paymentDate: z.string().min(1, "Date is required"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

function statusVariant(s: string) {
  if (s === "COMPLETED") return "default";
  if (s === "FAILED" || s === "REFUNDED") return "destructive";
  return "secondary";
}

export default function Payments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({ queryKey: ["payments"], queryFn: getPayments });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const { data: revenue } = useQuery({ queryKey: ["revenue"], queryFn: getRevenue });

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { memberId: "", amount: 0, paymentMethod: "CASH", description: "", paymentDate: new Date().toISOString().split("T")[0] },
  });

  const createMutation = useMutation({
    mutationFn: (data: PaymentForm) => createPayment(data.memberId, { amount: data.amount, paymentMethod: data.paymentMethod, description: data.description, paymentDate: data.paymentDate, status: "COMPLETED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Payment recorded" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updatePaymentStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast({ title: "Status updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast({ title: "Payment deleted" });
      setDeletingId(null);
    },
  });

  const memberName = (payment: any) => {
    const m = members?.find((m: any) => m.id === (payment.member?.id || payment.memberId));
    return m ? `${m.firstName} ${m.lastName}` : (payment.member?.firstName ? `${payment.member.firstName} ${payment.member.lastName}` : "—");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Track and manage all financial transactions.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-payment">
          <Plus className="w-4 h-4 mr-2" />Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${revenue?.todayRevenue ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${revenue?.monthlyRevenue ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${revenue?.totalRevenue ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !payments?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded yet.</TableCell></TableRow>
              ) : payments.map((p: any) => (
                <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                  <TableCell className="font-medium">{memberName(p)}</TableCell>
                  <TableCell className="font-mono font-medium text-primary">${p.amount}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.paymentMethod?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {p.status === "PENDING" && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: p.id.toString(), status: "COMPLETED" })}>Mark Completed</DropdownMenuItem>}
                        {p.status !== "REFUNDED" && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: p.id.toString(), status: "REFUNDED" })}>Refund</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(p.id.toString())}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) form.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-payment-member"><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-payment-amount" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="paymentDate" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Monthly membership, personal training..." /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-payment">Record</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Payment?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this payment record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
