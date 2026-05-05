import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, getMaintenance, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "OUT_OF_ORDER", "RETIRED"]),
  notes: z.string().optional(),
});

const maintenanceSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required"),
  maintenanceType: z.string().min(1, "Type is required"),
  maintenanceDate: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  cost: z.coerce.number().optional(),
  performedBy: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

type EquipmentForm = z.infer<typeof equipmentSchema>;
type MaintenanceForm = z.infer<typeof maintenanceSchema>;

function equipmentStatusVariant(s: string) {
  if (s === "OPERATIONAL") return "default";
  if (s === "OUT_OF_ORDER") return "destructive";
  if (s === "MAINTENANCE") return "secondary";
  return "outline";
}

function maintenanceStatusVariant(s: string) {
  if (s === "COMPLETED") return "default";
  if (s === "IN_PROGRESS") return "secondary";
  if (s === "CANCELLED") return "outline";
  return "secondary";
}

export default function Equipment() {
  const [tab, setTab] = useState("equipment");
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<any>(null);
  const [editingMaint, setEditingMaint] = useState<any>(null);
  const [deletingEquipId, setDeletingEquipId] = useState<string | null>(null);
  const [deletingMaintId, setDeletingMaintId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipment, isLoading: loadingEquip } = useQuery({ queryKey: ["equipment"], queryFn: () => getEquipment() });
  const { data: maintenance, isLoading: loadingMaint } = useQuery({ queryKey: ["maintenance"], queryFn: () => getMaintenance(), enabled: tab === "maintenance" });

  const equipForm = useForm<EquipmentForm>({ resolver: zodResolver(equipmentSchema), defaultValues: { name: "", brand: "", model: "", purchaseDate: "", location: "", status: "OPERATIONAL", notes: "" } });
  const maintForm = useForm<MaintenanceForm>({ resolver: zodResolver(maintenanceSchema), defaultValues: { equipmentId: "", maintenanceType: "", maintenanceDate: new Date().toISOString().split("T")[0], description: "", cost: 0, performedBy: "", status: "SCHEDULED" } });

  const createEquipMutation = useMutation({
    mutationFn: (d: EquipmentForm) => createEquipment(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); toast({ title: "Equipment added" }); setEquipDialogOpen(false); equipForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateEquipMutation = useMutation({
    mutationFn: (d: EquipmentForm) => updateEquipment(editingEquip.id.toString(), d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); toast({ title: "Equipment updated" }); setEquipDialogOpen(false); setEditingEquip(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteEquipMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); toast({ title: "Equipment deleted" }); setDeletingEquipId(null); },
  });

  const createMaintMutation = useMutation({
    mutationFn: (d: MaintenanceForm) => createMaintenanceLog(d.equipmentId, { maintenanceType: d.maintenanceType, maintenanceDate: d.maintenanceDate, description: d.description, cost: d.cost, performedBy: d.performedBy, status: d.status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast({ title: "Maintenance log created" }); setMaintDialogOpen(false); maintForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMaintMutation = useMutation({
    mutationFn: (d: MaintenanceForm) => updateMaintenanceLog(editingMaint.id.toString(), d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast({ title: "Updated" }); setMaintDialogOpen(false); setEditingMaint(null); },
  });

  const deleteMaintMutation = useMutation({
    mutationFn: (id: string) => deleteMaintenanceLog(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast({ title: "Log deleted" }); setDeletingMaintId(null); },
  });

  const openEditEquip = (e: any) => {
    setEditingEquip(e);
    equipForm.reset({ name: e.name, brand: e.brand || "", model: e.model || "", purchaseDate: e.purchaseDate ? e.purchaseDate.split("T")[0] : "", location: e.location || "", status: e.status, notes: e.notes || "" });
    setEquipDialogOpen(true);
  };

  const openEditMaint = (m: any) => {
    setEditingMaint(m);
    maintForm.reset({ equipmentId: (m.equipment?.id || m.equipmentId || "").toString(), maintenanceType: m.maintenanceType, maintenanceDate: m.maintenanceDate ? m.maintenanceDate.split("T")[0] : "", description: m.description || "", cost: m.cost || 0, performedBy: m.performedBy || "", status: m.status });
    setMaintDialogOpen(true);
  };

  const equipName = (id: any) => equipment?.find((e: any) => e.id === parseInt(id))?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground mt-1">Track gym equipment and maintenance records.</p>
        </div>
        <Button onClick={() => { setEditingEquip(null); equipForm.reset(); setEquipDialogOpen(true); }} data-testid="button-add-equipment">
          <Plus className="w-4 h-4 mr-2" />{tab === "maintenance" ? "Log Maintenance" : "Add Equipment"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEquip ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : !equipment?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No equipment added yet.</p></TableCell></TableRow>
                  ) : equipment.map((e: any) => (
                    <TableRow key={e.id} data-testid={`row-equipment-${e.id}`}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{[e.brand, e.model].filter(Boolean).join(" · ") || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.location || "—"}</TableCell>
                      <TableCell><Badge variant={equipmentStatusVariant(e.status)}>{e.status?.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.purchaseDate ? new Date(e.purchaseDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditEquip(e)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { maintForm.reset({ equipmentId: e.id.toString(), maintenanceType: "", maintenanceDate: new Date().toISOString().split("T")[0], description: "", cost: 0, performedBy: "", status: "SCHEDULED" }); setEditingMaint(null); setMaintDialogOpen(true); }}>Add Maintenance</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingEquipId(e.id.toString())}>Delete</DropdownMenuItem>
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

        <TabsContent value="maintenance" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditingMaint(null); maintForm.reset(); setMaintDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Log Maintenance</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMaint ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : !maintenance?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No maintenance logs yet.</TableCell></TableRow>
                  ) : maintenance.map((m: any) => (
                    <TableRow key={m.id} data-testid={`row-maintenance-${m.id}`}>
                      <TableCell className="font-medium">{m.equipment?.name || equipName(m.equipmentId)}</TableCell>
                      <TableCell>{m.maintenanceType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.maintenanceDate ? new Date(m.maintenanceDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.performedBy || "—"}</TableCell>
                      <TableCell className="text-sm">{m.cost != null ? `$${m.cost}` : "—"}</TableCell>
                      <TableCell><Badge variant={maintenanceStatusVariant(m.status)}>{m.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditMaint(m)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingMaintId(m.id.toString())}>Delete</DropdownMenuItem>
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

      {/* Equipment Dialog */}
      <Dialog open={equipDialogOpen} onOpenChange={(o) => { setEquipDialogOpen(o); if (!o) { setEditingEquip(null); equipForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEquip ? "Edit Equipment" : "Add Equipment"}</DialogTitle></DialogHeader>
          <Form {...equipForm}>
            <form onSubmit={equipForm.handleSubmit((d) => editingEquip ? updateEquipMutation.mutate(d) : createEquipMutation.mutate(d))} className="space-y-4">
              <FormField control={equipForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} data-testid="input-equipment-name" /></FormControl><FormMessage /></FormItem>} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={equipForm.control} name="brand" render={({ field }) => <FormItem><FormLabel>Brand</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={equipForm.control} name="model" render={({ field }) => <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={equipForm.control} name="location" render={({ field }) => <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={equipForm.control} name="purchaseDate" render={({ field }) => <FormItem><FormLabel>Purchase Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={equipForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={equipForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEquipDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createEquipMutation.isPending || updateEquipMutation.isPending} data-testid="button-submit-equipment">{editingEquip ? "Save Changes" : "Add Equipment"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintDialogOpen} onOpenChange={(o) => { setMaintDialogOpen(o); if (!o) { setEditingMaint(null); maintForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMaint ? "Edit Maintenance Log" : "Log Maintenance"}</DialogTitle></DialogHeader>
          <Form {...maintForm}>
            <form onSubmit={maintForm.handleSubmit((d) => editingMaint ? updateMaintMutation.mutate(d) : createMaintMutation.mutate(d))} className="space-y-4">
              <FormField control={maintForm.control} name="equipmentId" render={({ field }) => (
                <FormItem><FormLabel>Equipment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger></FormControl>
                    <SelectContent>{equipment?.map((e: any) => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={maintForm.control} name="maintenanceType" render={({ field }) => <FormItem><FormLabel>Type</FormLabel><FormControl><Input {...field} placeholder="e.g. Lubrication" /></FormControl><FormMessage /></FormItem>} />
                <FormField control={maintForm.control} name="maintenanceDate" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={maintForm.control} name="cost" render={({ field }) => <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={maintForm.control} name="performedBy" render={({ field }) => <FormItem><FormLabel>Performed By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={maintForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={maintForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMaintDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMaintMutation.isPending || updateMaintMutation.isPending} data-testid="button-submit-maintenance">{editingMaint ? "Save" : "Log"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEquipId} onOpenChange={(o) => !o && setDeletingEquipId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Equipment?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this equipment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingEquipId && deleteEquipMutation.mutate(deletingEquipId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingMaintId} onOpenChange={(o) => !o && setDeletingMaintId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Log?</AlertDialogTitle><AlertDialogDescription>This will remove this maintenance log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingMaintId && deleteMaintMutation.mutate(deletingMaintId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
