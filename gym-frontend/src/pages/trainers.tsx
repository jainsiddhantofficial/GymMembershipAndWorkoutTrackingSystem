import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTrainers, createUser, updateUser, deleteUser, toggleUserActive } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal, UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const trainerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().optional(),
});

type TrainerForm = z.infer<typeof trainerSchema>;

export default function Trainers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trainers, isLoading, isError } = useQuery({
    queryKey: ["trainers"],
    queryFn: getTrainers,
  });

  const form = useForm<TrainerForm>({
    resolver: zodResolver(trainerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", gender: "MALE", address: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: TrainerForm) => createUser({ ...data, role: "TRAINER" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      toast({ title: "Trainer created" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: TrainerForm) => updateUser(editingTrainer.id.toString(), { ...data, role: "TRAINER" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      toast({ title: "Trainer updated" });
      setDialogOpen(false);
      setEditingTrainer(null);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      toast({ title: "Trainer deleted" });
      setDeletingId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleUserActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainers"] }),
  });

  const filtered = trainers?.filter((t: any) =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingTrainer(null);
    form.reset({ firstName: "", lastName: "", email: "", phone: "", gender: "MALE", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (trainer: any) => {
    setEditingTrainer(trainer);
    form.reset({
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone || "",
      gender: trainer.gender || "MALE",
      address: trainer.address || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: TrainerForm) => {
    if (editingTrainer) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
          <p className="text-muted-foreground mt-1">Manage your gym's training staff.</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-trainer">
          <Plus className="w-4 h-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search trainers..." className="pl-9 bg-background/50" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-trainers" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Failed to load trainers.</TableCell></TableRow>
              ) : !filtered?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No trainers found.</TableCell></TableRow>
              ) : filtered.map((t: any) => (
                <TableRow key={t.id} data-testid={`row-trainer-${t.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {t.firstName?.[0]}{t.lastName?.[0]}
                      </div>
                      <div className="font-medium">{t.firstName} {t.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{t.email}</div>
                    <div className="text-xs text-muted-foreground">{t.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{t.gender?.toLowerCase()}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-trainer-${t.id}`}><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMutation.mutate(t.id.toString())}>
                          {t.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(t.id.toString())}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingTrainer(null); form.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTrainer ? "Edit Trainer" : "Add Trainer"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} data-testid="input-first-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} data-testid="input-last-name" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} data-testid="input-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-trainer">
                  {editingTrainer ? "Save Changes" : "Create Trainer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Trainer?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
