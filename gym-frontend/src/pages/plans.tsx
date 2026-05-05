import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, CreditCard, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  durationMonths: z.coerce.number().min(1, "Duration must be >= 1"),
  features: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PlanForm = z.infer<typeof planSchema>;

export default function Plans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["plans"],
    queryFn: () => getPlans(),
  });

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", description: "", price: 0, durationMonths: 1, features: "", isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanForm) => createPlan({ ...data, features: data.features?.split("\n").filter(Boolean) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plan created" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PlanForm) => updatePlan(editingPlan.id.toString(), { ...data, features: data.features?.split("\n").filter(Boolean) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plan updated" });
      setDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plan deleted" });
      setDeletingId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingPlan(null);
    form.reset({ name: "", description: "", price: 0, durationMonths: 1, features: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      durationMonths: plan.durationMonths,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      isActive: plan.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: PlanForm) => {
    if (editingPlan) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
          <p className="text-muted-foreground mt-1">Define and manage subscription plans for your members.</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-plan">
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
        </div>
      ) : isError ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Failed to load plans.</CardContent></Card>
      ) : !plans?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No plans yet. Create your first membership plan.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <Card key={plan.id} className={`relative ${!plan.isActive ? "opacity-60" : ""}`} data-testid={`card-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>{plan.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/ {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}</span>
                </div>
              </CardHeader>
              <CardContent>
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(plan.id.toString())} data-testid={`button-delete-plan-${plan.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingPlan(null); form.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPlan ? "Edit Plan" : "New Membership Plan"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} data-testid="input-plan-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-plan-price" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="durationMonths" render={({ field }) => (
                  <FormItem><FormLabel>Duration (months)</FormLabel><FormControl><Input type="number" min={1} {...field} data-testid="input-plan-duration" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="features" render={({ field }) => (
                <FormItem><FormLabel>Features (one per line)</FormLabel><FormControl><Textarea {...field} rows={4} placeholder={"Unlimited gym access\nPersonal locker\nGroup classes"} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-plan">
                  {editingPlan ? "Save Changes" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this membership plan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
