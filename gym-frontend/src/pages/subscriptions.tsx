import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubscriptions, getMembers, getPlans, createSubscription, freezeSubscription, unfreezeSubscription, updateSubscriptionStatus, deleteSubscription, getExpiringSoon } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const subSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  planId: z.string().min(1, "Plan is required"),
  startDate: z.string().min(1, "Start date is required"),
  autoRenew: z.boolean().default(false),
});

type SubForm = z.infer<typeof subSchema>;

function statusVariant(s: string) {
  if (s === "ACTIVE") return "default";
  if (s === "EXPIRED") return "destructive";
  if (s === "FROZEN") return "secondary";
  return "outline";
}

export default function Subscriptions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({ queryKey: ["subscriptions", statusFilter], queryFn: () => getSubscriptions(statusFilter === "ALL" ? undefined : statusFilter) });
  const { data: expiring } = useQuery({ queryKey: ["subscriptions-expiring"], queryFn: getExpiringSoon });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => getPlans() });

  const form = useForm<SubForm>({
    resolver: zodResolver(subSchema),
    defaultValues: { memberId: "", planId: "", startDate: new Date().toISOString().split("T")[0], autoRenew: false },
  });

  const createMutation = useMutation({
    mutationFn: (data: SubForm) => createSubscription({ memberId: parseInt(data.memberId), planId: parseInt(data.planId), startDate: data.startDate, autoRenew: data.autoRenew }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscriptions"] }); toast({ title: "Subscription created" }); setDialogOpen(false); form.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const freezeMutation = useMutation({
    mutationFn: (id: string) => freezeSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscriptions"] }); toast({ title: "Subscription frozen" }); },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => unfreezeSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscriptions"] }); toast({ title: "Subscription unfrozen" }); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateSubscriptionStatus(id, "CANCELLED"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscriptions"] }); toast({ title: "Subscription cancelled" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscriptions"] }); toast({ title: "Subscription deleted" }); setDeletingId(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const memberName = (id: any) => {
    const m = members?.find((m: any) => m.id === id);
    return m ? `${m.firstName} ${m.lastName}` : id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Track member subscriptions and their status.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-subscription">
          <Plus className="w-4 h-4 mr-2" />New Subscription
        </Button>
      </div>

      {expiring && expiring.length > 0 && (
        <Card className="border-yellow-500/40 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              {expiring.length} subscription{expiring.length !== 1 ? "s" : ""} expiring within 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiring.map((s: any) => (
                <Badge key={s.id} variant="outline" className="text-yellow-400 border-yellow-500/40">
                  {memberName(s.member?.id || s.memberId)} — {new Date(s.endDate).toLocaleDateString()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
          <TabsTrigger value="FROZEN">Frozen</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : !subscriptions?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subscriptions found.</TableCell></TableRow>
                  ) : subscriptions.map((s: any) => (
                    <TableRow key={s.id} data-testid={`row-subscription-${s.id}`}>
                      <TableCell className="font-medium">{memberName(s.member?.id || s.memberId)}</TableCell>
                      <TableCell>{s.plan?.name || s.planId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant(s.status)}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {s.status === "ACTIVE" && <DropdownMenuItem onClick={() => freezeMutation.mutate(s.id.toString())}>Freeze</DropdownMenuItem>}
                            {s.status === "FROZEN" && <DropdownMenuItem onClick={() => unfreezeMutation.mutate(s.id.toString())}>Unfreeze</DropdownMenuItem>}
                            {s.status !== "CANCELLED" && <DropdownMenuItem onClick={() => cancelMutation.mutate(s.id.toString())}>Cancel</DropdownMenuItem>}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(s.id.toString())}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) form.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Subscription</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-member"><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="planId" render={({ field }) => (
                <FormItem><FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-plan"><SelectValue placeholder="Select plan" /></SelectTrigger></FormControl>
                    <SelectContent>{plans?.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name} — ${p.price}/{p.durationMonths}mo</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-start-date" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-subscription">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Subscription?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
