import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDietPlans, getMembers, getTrainers, createDietPlan, updateDietPlan, deleteDietPlan, getDietPlanMeals, addMeal, updateMeal, deleteMeal } from "@/lib/api";
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
import { Plus, MoreHorizontal, Apple, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  memberId: z.string().min(1, "Member is required"),
  trainerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

const mealSchema = z.object({
  mealType: z.string().min(1, "Type is required"),
  foodItems: z.string().min(1, "Food items required"),
  calories: z.coerce.number().min(0).optional(),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type PlanForm = z.infer<typeof planSchema>;
type MealForm = z.infer<typeof mealSchema>;

export default function Diet() {
  const [planDialog, setPlanDialog] = useState(false);
  const [mealDialog, setMealDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({ queryKey: ["diet-plans"], queryFn: getDietPlans });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const { data: trainers } = useQuery({ queryKey: ["trainers"], queryFn: getTrainers });
  const { data: meals } = useQuery({ queryKey: ["meals", selectedPlan?.id], queryFn: () => getDietPlanMeals(selectedPlan.id.toString()), enabled: !!selectedPlan });

  const planForm = useForm<PlanForm>({ resolver: zodResolver(planSchema), defaultValues: { name: "", description: "", memberId: "", trainerId: "", startDate: "", endDate: "", isActive: true } });
  const mealForm = useForm<MealForm>({ resolver: zodResolver(mealSchema), defaultValues: { mealType: "BREAKFAST", foodItems: "", calories: 0, protein: 0, carbs: 0, fat: 0, notes: "" } });

  const createPlanMutation = useMutation({
    mutationFn: (d: PlanForm) => createDietPlan({ name: d.name, description: d.description, startDate: d.startDate, endDate: d.endDate, isActive: d.isActive }, d.memberId, d.trainerId || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["diet-plans"] }); toast({ title: "Diet plan created" }); setPlanDialog(false); planForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: (d: PlanForm) => updateDietPlan(editingPlan.id.toString(), { name: d.name, description: d.description, startDate: d.startDate, endDate: d.endDate, isActive: d.isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["diet-plans"] }); toast({ title: "Plan updated" }); setPlanDialog(false); setEditingPlan(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => deleteDietPlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["diet-plans"] }); toast({ title: "Plan deleted" }); setDeletingPlanId(null); if (selectedPlan) setSelectedPlan(null); },
  });

  const addMealMutation = useMutation({
    mutationFn: (d: MealForm) => addMeal(selectedPlan.id.toString(), d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["meals", selectedPlan?.id] }); toast({ title: "Meal added" }); setMealDialog(false); mealForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMealMutation = useMutation({
    mutationFn: (d: MealForm) => updateMeal(editingMeal.id.toString(), d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["meals", selectedPlan?.id] }); toast({ title: "Meal updated" }); setMealDialog(false); setEditingMeal(null); },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id: string) => deleteMeal(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["meals", selectedPlan?.id] }); toast({ title: "Meal deleted" }); setDeletingMealId(null); },
  });

  const openEditPlan = (p: any) => {
    setEditingPlan(p);
    planForm.reset({
      name: p.name, description: p.description || "",
      memberId: (p.member?.id || p.memberId || "").toString(),
      trainerId: (p.trainer?.id || p.trainerId || "").toString(),
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      endDate: p.endDate ? p.endDate.split("T")[0] : "",
      isActive: p.isActive,
    });
    setPlanDialog(true);
  };

  const openEditMeal = (m: any) => {
    setEditingMeal(m);
    mealForm.reset({ mealType: m.mealType, foodItems: m.foodItems, calories: m.calories || 0, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0, notes: m.notes || "" });
    setMealDialog(true);
  };

  const memberName = (p: any) => {
    const m = members?.find((m: any) => m.id === (p.member?.id || p.memberId));
    return m ? `${m.firstName} ${m.lastName}` : "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diet Plans</h1>
          <p className="text-muted-foreground mt-1">Manage nutrition plans and meal schedules for members.</p>
        </div>
        <Button onClick={() => { setEditingPlan(null); planForm.reset(); setPlanDialog(true); }} data-testid="button-add-diet-plan">
          <Plus className="w-4 h-4 mr-2" />New Diet Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans List */}
        <div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Member</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    : !plans?.length ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground"><Apple className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No diet plans yet.</p></TableCell></TableRow>
                      : plans.map((p: any) => (
                        <TableRow key={p.id} className={`cursor-pointer ${selectedPlan?.id === p.id ? "bg-accent" : ""}`} onClick={() => setSelectedPlan(p)} data-testid={`row-dietplan-${p.id}`}>
                          <TableCell>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.description}</div>
                          </TableCell>
                          <TableCell className="text-sm">{memberName(p)}</TableCell>
                          <TableCell><Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditPlan(p); }}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingPlanId(p.id.toString()); }}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Meals */}
        {selectedPlan ? (
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedPlan.name} — Meals</CardTitle>
                </div>
                <Button size="sm" onClick={() => { setEditingMeal(null); mealForm.reset(); setMealDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Meal</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Food Items</TableHead><TableHead>Cal</TableHead><TableHead>P/C/F</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {!meals?.length ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">No meals yet. Add one above.</TableCell></TableRow>
                      : meals.map((m: any) => (
                        <TableRow key={m.id} data-testid={`row-meal-${m.id}`}>
                          <TableCell><Badge variant="outline" className="text-xs">{m.mealType?.replace("_", " ")}</Badge></TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{m.foodItems}</TableCell>
                          <TableCell className="text-sm text-primary font-medium">{m.calories ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{m.protein ?? "?"}g / {m.carbs ?? "?"}g / {m.fat ?? "?"}g</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditMeal(m)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingMealId(m.id.toString())}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Select a diet plan to view its meals.</CardContent></Card>
        )}
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={(o) => { setPlanDialog(o); if (!o) { setEditingPlan(null); planForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPlan ? "Edit Diet Plan" : "New Diet Plan"}</DialogTitle></DialogHeader>
          <Form {...planForm}>
            <form onSubmit={planForm.handleSubmit((d) => editingPlan ? updatePlanMutation.mutate(d) : createPlanMutation.mutate(d))} className="space-y-4">
              <FormField control={planForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} data-testid="input-diet-plan-name" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={planForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={planForm.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-diet-member"><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="trainerId" render={({ field }) => (
                <FormItem><FormLabel>Trainer (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {trainers?.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.firstName} {t.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={planForm.control} name="startDate" render={({ field }) => <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={planForm.control} name="endDate" render={({ field }) => <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPlanDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createPlanMutation.isPending || updatePlanMutation.isPending} data-testid="button-submit-diet-plan">{editingPlan ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Meal Dialog */}
      <Dialog open={mealDialog} onOpenChange={(o) => { setMealDialog(o); if (!o) { setEditingMeal(null); mealForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMeal ? "Edit Meal" : "Add Meal"}</DialogTitle></DialogHeader>
          <Form {...mealForm}>
            <form onSubmit={mealForm.handleSubmit((d) => editingMeal ? updateMealMutation.mutate(d) : addMealMutation.mutate(d))} className="space-y-4">
              <FormField control={mealForm.control} name="mealType" render={({ field }) => (
                <FormItem><FormLabel>Meal Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{MEAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={mealForm.control} name="foodItems" render={({ field }) => <FormItem><FormLabel>Food Items</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Oatmeal, banana, protein shake..." /></FormControl><FormMessage /></FormItem>} />
              <div className="grid grid-cols-4 gap-3">
                <FormField control={mealForm.control} name="calories" render={({ field }) => <FormItem><FormLabel>Calories</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={mealForm.control} name="protein" render={({ field }) => <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={mealForm.control} name="carbs" render={({ field }) => <FormItem><FormLabel>Carbs (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={mealForm.control} name="fat" render={({ field }) => <FormItem><FormLabel>Fat (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={mealForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMealDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={addMealMutation.isPending || updateMealMutation.isPending} data-testid="button-submit-meal">{editingMeal ? "Save" : "Add Meal"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlanId} onOpenChange={(o) => !o && setDeletingPlanId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Diet Plan?</AlertDialogTitle><AlertDialogDescription>This will remove the plan and all its meals.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingPlanId && deletePlanMutation.mutate(deletingPlanId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingMealId} onOpenChange={(o) => !o && setDeletingMealId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Meal?</AlertDialogTitle><AlertDialogDescription>This will remove this meal from the plan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingMealId && deleteMealMutation.mutate(deletingMealId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
