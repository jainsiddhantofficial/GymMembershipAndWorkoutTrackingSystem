import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, getTrainers, getMembers, createClass, updateClass, deleteClass, getBookings, createBooking, updateBookingStatus, deleteBooking } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Users, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trainerId: z.string().optional(),
  capacity: z.coerce.number().min(1),
  classDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
});

const bookingSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  gymClassId: z.string().min(1, "Class is required"),
  notes: z.string().optional(),
});

type ClassForm = z.infer<typeof classSchema>;
type BookingForm = z.infer<typeof bookingSchema>;

function bookingStatusVariant(s: string) {
  if (s === "CONFIRMED" || s === "COMPLETED") return "default";
  if (s === "CANCELLED" || s === "NO_SHOW") return "destructive";
  return "secondary";
}

export default function Classes() {
  const [tab, setTab] = useState("classes");
  const [classDialog, setClassDialog] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes, isLoading: loadingClasses } = useQuery({ queryKey: ["classes"], queryFn: () => getClasses() });
  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["bookings"], queryFn: getBookings, enabled: tab === "bookings" });
  const { data: trainers } = useQuery({ queryKey: ["trainers"], queryFn: getTrainers });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });

  const classForm = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues: { name: "", description: "", trainerId: "", capacity: 20, classDate: new Date().toISOString().split("T")[0], startTime: "09:00", endTime: "10:00", location: "", isActive: true } });
  const bookingForm = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), defaultValues: { memberId: "", gymClassId: "", notes: "" } });

  const createClassMutation = useMutation({
    mutationFn: (d: ClassForm) => createClass({ name: d.name, description: d.description, capacity: d.capacity, classDate: d.classDate, startTime: d.startTime, endTime: d.endTime, location: d.location, isActive: d.isActive }, d.trainerId || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["classes"] }); toast({ title: "Class created" }); setClassDialog(false); classForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateClassMutation = useMutation({
    mutationFn: (d: ClassForm) => updateClass(editingClass.id.toString(), { name: d.name, description: d.description, capacity: d.capacity, classDate: d.classDate, startTime: d.startTime, endTime: d.endTime, location: d.location, isActive: d.isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["classes"] }); toast({ title: "Class updated" }); setClassDialog(false); setEditingClass(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["classes"] }); toast({ title: "Class deleted" }); setDeletingClassId(null); },
  });

  const createBookingMutation = useMutation({
    mutationFn: (d: BookingForm) => createBooking({ memberId: parseInt(d.memberId), gymClassId: parseInt(d.gymClassId), notes: d.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); queryClient.invalidateQueries({ queryKey: ["classes"] }); toast({ title: "Booking created" }); setBookingDialog(false); bookingForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); toast({ title: "Status updated" }); },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); toast({ title: "Booking deleted" }); setDeletingBookingId(null); },
  });

  const openEditClass = (c: any) => {
    setEditingClass(c);
    classForm.reset({
      name: c.name, description: c.description || "",
      trainerId: (c.trainer?.id || c.trainerId || "").toString(),
      capacity: c.capacity,
      classDate: c.classDate ? c.classDate.split("T")[0] : "",
      startTime: c.startTime || "",
      endTime: c.endTime || "",
      location: c.location || "",
      isActive: c.isActive,
    });
    setClassDialog(true);
  };

  const memberName = (booking: any) => {
    const m = members?.find((m: any) => m.id === (booking.member?.id || booking.memberId));
    return m ? `${m.firstName} ${m.lastName}` : (booking.member?.firstName ? `${booking.member.firstName} ${booking.member.lastName}` : "—");
  };

  const trainerName = (c: any) => {
    const t = trainers?.find((t: any) => t.id === (c.trainer?.id || c.trainerId));
    return t ? `${t.firstName} ${t.lastName}` : (c.trainer?.firstName ? `${c.trainer.firstName} ${c.trainer.lastName}` : "No trainer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes & Bookings</h1>
          <p className="text-muted-foreground mt-1">Schedule classes and manage member bookings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setBookingDialog(true); }} data-testid="button-add-booking"><Plus className="w-4 h-4 mr-2" />New Booking</Button>
          <Button onClick={() => { setEditingClass(null); classForm.reset(); setClassDialog(true); }} data-testid="button-add-class"><Plus className="w-4 h-4 mr-2" />New Class</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingClasses ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    : !classes?.length ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No classes scheduled.</p></TableCell></TableRow>
                      : classes.map((c: any) => (
                        <TableRow key={c.id} data-testid={`row-class-${c.id}`}>
                          <TableCell>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.description}</div>
                          </TableCell>
                          <TableCell className="text-sm">{trainerName(c)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{c.classDate ? new Date(c.classDate).toLocaleDateString() : "—"}</div>
                            <div className="text-xs text-muted-foreground">{c.startTime} – {c.endTime}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.location || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">{c.currentEnrollment ?? 0}/{c.capacity}</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditClass(c)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { bookingForm.reset({ memberId: "", gymClassId: c.id.toString(), notes: "" }); setBookingDialog(true); }}>Book Member</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingClassId(c.id.toString())}>Delete</DropdownMenuItem>
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

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBookings ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    : !bookings?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No bookings yet.</TableCell></TableRow>
                      : bookings.map((b: any) => (
                        <TableRow key={b.id} data-testid={`row-booking-${b.id}`}>
                          <TableCell className="font-medium">{memberName(b)}</TableCell>
                          <TableCell className="text-sm">{b.gymClass?.name || b.gymClassId}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : "—"}</TableCell>
                          <TableCell><Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {b.status === "PENDING" && <DropdownMenuItem onClick={() => bookingStatusMutation.mutate({ id: b.id.toString(), status: "CONFIRMED" })}>Confirm</DropdownMenuItem>}
                                {b.status === "CONFIRMED" && <DropdownMenuItem onClick={() => bookingStatusMutation.mutate({ id: b.id.toString(), status: "COMPLETED" })}>Mark Completed</DropdownMenuItem>}
                                {(b.status === "PENDING" || b.status === "CONFIRMED") && <DropdownMenuItem onClick={() => bookingStatusMutation.mutate({ id: b.id.toString(), status: "CANCELLED" })}>Cancel</DropdownMenuItem>}
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingBookingId(b.id.toString())}>Delete</DropdownMenuItem>
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

      {/* Class Dialog */}
      <Dialog open={classDialog} onOpenChange={(o) => { setClassDialog(o); if (!o) { setEditingClass(null); classForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingClass ? "Edit Class" : "New Class"}</DialogTitle></DialogHeader>
          <Form {...classForm}>
            <form onSubmit={classForm.handleSubmit((d) => editingClass ? updateClassMutation.mutate(d) : createClassMutation.mutate(d))} className="space-y-4">
              <FormField control={classForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Class Name</FormLabel><FormControl><Input {...field} data-testid="input-class-name" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={classForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={classForm.control} name="trainerId" render={({ field }) => (
                  <FormItem><FormLabel>Trainer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {trainers?.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.firstName} {t.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={classForm.control} name="capacity" render={({ field }) => <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={classForm.control} name="classDate" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={classForm.control} name="startTime" render={({ field }) => <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={classForm.control} name="endTime" render={({ field }) => <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={classForm.control} name="location" render={({ field }) => <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="Studio A, Main floor..." /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClassDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createClassMutation.isPending || updateClassMutation.isPending} data-testid="button-submit-class">{editingClass ? "Save" : "Create Class"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={(o) => { setBookingDialog(o); if (!o) bookingForm.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
          <Form {...bookingForm}>
            <form onSubmit={bookingForm.handleSubmit((d) => createBookingMutation.mutate(d))} className="space-y-4">
              <FormField control={bookingForm.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-booking-member"><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={bookingForm.control} name="gymClassId" render={({ field }) => (
                <FormItem><FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-booking-class"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                    <SelectContent>{classes?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name} — {c.classDate ? new Date(c.classDate).toLocaleDateString() : ""}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={bookingForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBookingDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createBookingMutation.isPending} data-testid="button-submit-booking">Book</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingClassId} onOpenChange={(o) => !o && setDeletingClassId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Class?</AlertDialogTitle><AlertDialogDescription>This will remove the class and all its bookings.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingClassId && deleteClassMutation.mutate(deletingClassId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingBookingId} onOpenChange={(o) => !o && setDeletingBookingId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Booking?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this booking.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingBookingId && deleteBookingMutation.mutate(deletingBookingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
