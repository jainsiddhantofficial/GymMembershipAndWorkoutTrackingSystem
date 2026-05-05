import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExercises, createExercise, updateExercise, deleteExercise, getMembers, getUserWorkoutSessions, createWorkoutSession, deleteWorkoutSession, getSessionLogs, addWorkoutLog, deleteWorkoutLog, getUserBodyMetrics, addBodyMetric, deleteBodyMetric } from "@/lib/api";
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
import { Plus, MoreHorizontal, ChevronRight, Dumbbell } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const MUSCLE_GROUPS = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS", "CORE", "QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "FULL_BODY", "CARDIO"];

const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Muscle group is required"),
  instructions: z.string().optional(),
  videoUrl: z.string().optional(),
});

const sessionSchema = z.object({
  memberId: z.string().min(1, "Member required"),
  sessionDate: z.string().min(1, "Date required"),
  notes: z.string().optional(),
});

const logSchema = z.object({
  exerciseId: z.string().min(1, "Exercise required"),
  sets: z.coerce.number().min(1),
  reps: z.coerce.number().min(0),
  weight: z.coerce.number().min(0),
  duration: z.coerce.number().min(0),
  notes: z.string().optional(),
});

const metricSchema = z.object({
  memberId: z.string().min(1, "Member required"),
  date: z.string().min(1, "Date required"),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  bodyFatPercentage: z.coerce.number().optional(),
  muscleMass: z.coerce.number().optional(),
  bmi: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ExerciseForm = z.infer<typeof exerciseSchema>;
type SessionForm = z.infer<typeof sessionSchema>;
type LogForm = z.infer<typeof logSchema>;
type MetricForm = z.infer<typeof metricSchema>;

export default function Workouts() {
  const [tab, setTab] = useState("exercises");
  const [exerciseDialog, setExerciseDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [logDialog, setLogDialog] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [metricDialog, setMetricDialog] = useState(false);
  const [deletingMetricId, setDeletingMetricId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exercises, isLoading: loadingExercises } = useQuery({ queryKey: ["exercises"], queryFn: () => getExercises() });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const { data: sessions, isLoading: loadingSessions } = useQuery({ queryKey: ["sessions", selectedMemberId], queryFn: () => getUserWorkoutSessions(selectedMemberId), enabled: !!selectedMemberId && tab === "sessions" });
  const { data: sessionLogs } = useQuery({ queryKey: ["session-logs", selectedSession?.id], queryFn: () => getSessionLogs(selectedSession.id.toString()), enabled: !!selectedSession });
  const { data: bodyMetrics, isLoading: loadingMetrics } = useQuery({ queryKey: ["body-metrics", selectedMemberId], queryFn: () => getUserBodyMetrics(selectedMemberId), enabled: !!selectedMemberId && tab === "metrics" });

  const exForm = useForm<ExerciseForm>({ resolver: zodResolver(exerciseSchema), defaultValues: { name: "", description: "", muscleGroup: "CHEST", instructions: "", videoUrl: "" } });
  const sessionForm = useForm<SessionForm>({ resolver: zodResolver(sessionSchema), defaultValues: { memberId: "", sessionDate: new Date().toISOString().split("T")[0], notes: "" } });
  const logForm = useForm<LogForm>({ resolver: zodResolver(logSchema), defaultValues: { exerciseId: "", sets: 3, reps: 10, weight: 0, duration: 0, notes: "" } });
  const metricForm = useForm<MetricForm>({ resolver: zodResolver(metricSchema), defaultValues: { memberId: "", date: new Date().toISOString().split("T")[0], weight: 0, height: 0, bodyFatPercentage: 0, muscleMass: 0, bmi: 0, notes: "" } });

  const createExerciseMutation = useMutation({
    mutationFn: (d: ExerciseForm) => createExercise(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exercises"] }); toast({ title: "Exercise added" }); setExerciseDialog(false); exForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateExerciseMutation = useMutation({
    mutationFn: (d: ExerciseForm) => updateExercise(editingExercise.id.toString(), d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exercises"] }); toast({ title: "Exercise updated" }); setExerciseDialog(false); setEditingExercise(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exercises"] }); toast({ title: "Exercise deleted" }); setDeletingExerciseId(null); },
  });

  const createSessionMutation = useMutation({
    mutationFn: (d: SessionForm) => createWorkoutSession(d.memberId, { sessionDate: d.sessionDate, notes: d.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sessions", selectedMemberId] }); toast({ title: "Session created" }); setSessionDialog(false); sessionForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => deleteWorkoutSession(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sessions", selectedMemberId] }); toast({ title: "Session deleted" }); setDeletingSessionId(null); },
  });

  const addLogMutation = useMutation({
    mutationFn: (d: LogForm) => addWorkoutLog(selectedSession.id.toString(), d.exerciseId, { sets: d.sets, reps: d.reps, weight: d.weight, duration: d.duration, notes: d.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["session-logs", selectedSession?.id] }); toast({ title: "Log added" }); setLogDialog(false); logForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLogMutation = useMutation({
    mutationFn: (id: string) => deleteWorkoutLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session-logs", selectedSession?.id] }),
  });

  const addMetricMutation = useMutation({
    mutationFn: (d: MetricForm) => addBodyMetric(d.memberId, { date: d.date, weight: d.weight, height: d.height, bodyFatPercentage: d.bodyFatPercentage, muscleMass: d.muscleMass, bmi: d.bmi, notes: d.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["body-metrics", selectedMemberId] }); toast({ title: "Metric added" }); setMetricDialog(false); metricForm.reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMetricMutation = useMutation({
    mutationFn: (id: string) => deleteBodyMetric(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["body-metrics", selectedMemberId] }); setDeletingMetricId(null); },
  });

  const openEditExercise = (e: any) => {
    setEditingExercise(e);
    exForm.reset({ name: e.name, description: e.description || "", muscleGroup: e.muscleGroup, instructions: e.instructions || "", videoUrl: e.videoUrl || "" });
    setExerciseDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
          <p className="text-muted-foreground mt-1">Exercise library, member sessions, and body metrics.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(t) => { setTab(t); setSelectedSession(null); }}>
        <TabsList>
          <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
          <TabsTrigger value="sessions">Workout Sessions</TabsTrigger>
          <TabsTrigger value="metrics">Body Metrics</TabsTrigger>
        </TabsList>

        {/* EXERCISES */}
        <TabsContent value="exercises" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingExercise(null); exForm.reset(); setExerciseDialog(true); }} data-testid="button-add-exercise"><Plus className="w-4 h-4 mr-2" />Add Exercise</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Exercise</TableHead><TableHead>Muscle Group</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loadingExercises ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    : !exercises?.length ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground"><Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No exercises yet.</p></TableCell></TableRow>
                      : exercises.map((e: any) => (
                        <TableRow key={e.id} data-testid={`row-exercise-${e.id}`}>
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{e.muscleGroup?.replace("_", " ")}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{e.description}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditExercise(e)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingExerciseId(e.id.toString())}>Delete</DropdownMenuItem>
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

        {/* SESSIONS */}
        <TabsContent value="sessions" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64" data-testid="select-session-member"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
            </Select>
            {selectedMemberId && (
              <Button onClick={() => { sessionForm.reset({ memberId: selectedMemberId, sessionDate: new Date().toISOString().split("T")[0], notes: "" }); setSessionDialog(true); }}><Plus className="w-4 h-4 mr-2" />New Session</Button>
            )}
          </div>
          {selectedMemberId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Sessions</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {loadingSessions ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-5 w-full" /></TableCell><TableCell><Skeleton className="h-5 w-full" /></TableCell><TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell></TableRow>)
                        : !sessions?.length ? <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No sessions yet.</TableCell></TableRow>
                          : sessions.map((s: any) => (
                            <TableRow key={s.id} className={`cursor-pointer ${selectedSession?.id === s.id ? "bg-accent" : ""}`} onClick={() => setSelectedSession(s)} data-testid={`row-session-${s.id}`}>
                              <TableCell className="text-sm">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString() : "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{s.notes || "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingSessionId(s.id.toString()); }}><MoreHorizontal className="w-4 h-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {selectedSession && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Logs — {new Date(selectedSession.sessionDate).toLocaleDateString()}</CardTitle>
                    <Button size="sm" onClick={() => { logForm.reset(); setLogDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Log</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Exercise</TableHead><TableHead>Sets</TableHead><TableHead>Reps</TableHead><TableHead>Weight</TableHead><TableHead className="text-right">Del</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {!sessionLogs?.length ? <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">No logs yet.</TableCell></TableRow>
                          : sessionLogs.map((l: any) => (
                            <TableRow key={l.id}>
                              <TableCell className="text-sm font-medium">{l.exercise?.name || l.exerciseId}</TableCell>
                              <TableCell className="text-sm">{l.sets}</TableCell>
                              <TableCell className="text-sm">{l.reps}</TableCell>
                              <TableCell className="text-sm">{l.weight ? `${l.weight}kg` : "—"}</TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteLogMutation.mutate(l.id.toString())}><MoreHorizontal className="w-3.5 h-3.5" /></Button></TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          {!selectedMemberId && <Card><CardContent className="py-12 text-center text-muted-foreground">Select a member to view their workout sessions.</CardContent></Card>}
        </TabsContent>

        {/* METRICS */}
        <TabsContent value="metrics" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
            </Select>
            {selectedMemberId && (
              <Button onClick={() => { metricForm.reset({ memberId: selectedMemberId, date: new Date().toISOString().split("T")[0] }); setMetricDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Metric</Button>
            )}
          </div>
          {selectedMemberId ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Weight (kg)</TableHead><TableHead>Height (cm)</TableHead><TableHead>Body Fat %</TableHead><TableHead>Muscle Mass</TableHead><TableHead>BMI</TableHead><TableHead className="text-right">Del</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loadingMetrics ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                      : !bodyMetrics?.length ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No body metrics recorded.</TableCell></TableRow>
                        : bodyMetrics.map((m: any) => (
                          <TableRow key={m.id} data-testid={`row-metric-${m.id}`}>
                            <TableCell className="text-sm">{m.date ? new Date(m.date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell className="text-sm">{m.weight ?? "—"}</TableCell>
                            <TableCell className="text-sm">{m.height ?? "—"}</TableCell>
                            <TableCell className="text-sm">{m.bodyFatPercentage != null ? `${m.bodyFatPercentage}%` : "—"}</TableCell>
                            <TableCell className="text-sm">{m.muscleMass ?? "—"}</TableCell>
                            <TableCell className="text-sm">{m.bmi ?? "—"}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => setDeletingMetricId(m.id.toString())}><MoreHorizontal className="w-3.5 h-3.5" /></Button></TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : <Card><CardContent className="py-12 text-center text-muted-foreground">Select a member to view their body metrics.</CardContent></Card>}
        </TabsContent>
      </Tabs>

      {/* Exercise Dialog */}
      <Dialog open={exerciseDialog} onOpenChange={(o) => { setExerciseDialog(o); if (!o) { setEditingExercise(null); exForm.reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingExercise ? "Edit Exercise" : "Add Exercise"}</DialogTitle></DialogHeader>
          <Form {...exForm}>
            <form onSubmit={exForm.handleSubmit((d) => editingExercise ? updateExerciseMutation.mutate(d) : createExerciseMutation.mutate(d))} className="space-y-4">
              <FormField control={exForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} data-testid="input-exercise-name" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={exForm.control} name="muscleGroup" render={({ field }) => (
                <FormItem><FormLabel>Muscle Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{g.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={exForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={exForm.control} name="instructions" render={({ field }) => <FormItem><FormLabel>Instructions</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setExerciseDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createExerciseMutation.isPending || updateExerciseMutation.isPending} data-testid="button-submit-exercise">{editingExercise ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={sessionDialog} onOpenChange={(o) => { setSessionDialog(o); if (!o) sessionForm.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Workout Session</DialogTitle></DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit((d) => createSessionMutation.mutate(d))} className="space-y-4">
              <FormField control={sessionForm.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={sessionForm.control} name="sessionDate" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={sessionForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSessionDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createSessionMutation.isPending}>Create Session</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={logDialog} onOpenChange={(o) => { setLogDialog(o); if (!o) logForm.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Workout Log</DialogTitle></DialogHeader>
          <Form {...logForm}>
            <form onSubmit={logForm.handleSubmit((d) => addLogMutation.mutate(d))} className="space-y-4">
              <FormField control={logForm.control} name="exerciseId" render={({ field }) => (
                <FormItem><FormLabel>Exercise</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select exercise" /></SelectTrigger></FormControl>
                    <SelectContent>{exercises?.map((e: any) => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={logForm.control} name="sets" render={({ field }) => <FormItem><FormLabel>Sets</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={logForm.control} name="reps" render={({ field }) => <FormItem><FormLabel>Reps</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={logForm.control} name="weight" render={({ field }) => <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={logForm.control} name="duration" render={({ field }) => <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={logForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLogDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={addLogMutation.isPending}>Add Log</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Body Metric Dialog */}
      <Dialog open={metricDialog} onOpenChange={(o) => { setMetricDialog(o); if (!o) metricForm.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Body Metric</DialogTitle></DialogHeader>
          <Form {...metricForm}>
            <form onSubmit={metricForm.handleSubmit((d) => addMetricMutation.mutate(d))} className="space-y-4">
              <FormField control={metricForm.control} name="memberId" render={({ field }) => (
                <FormItem><FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>{members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={metricForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={metricForm.control} name="weight" render={({ field }) => <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={metricForm.control} name="height" render={({ field }) => <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={metricForm.control} name="bodyFatPercentage" render={({ field }) => <FormItem><FormLabel>Body Fat %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={metricForm.control} name="muscleMass" render={({ field }) => <FormItem><FormLabel>Muscle Mass (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={metricForm.control} name="bmi" render={({ field }) => <FormItem><FormLabel>BMI</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={metricForm.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMetricDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={addMetricMutation.isPending}>Add Metric</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingExerciseId} onOpenChange={(o) => !o && setDeletingExerciseId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Exercise?</AlertDialogTitle><AlertDialogDescription>This will remove the exercise from the library.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingExerciseId && deleteExerciseMutation.mutate(deletingExerciseId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingSessionId} onOpenChange={(o) => !o && setDeletingSessionId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Session?</AlertDialogTitle><AlertDialogDescription>This will remove the workout session and its logs.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (deletingSessionId) { deleteSessionMutation.mutate(deletingSessionId); if (selectedSession?.id?.toString() === deletingSessionId) setSelectedSession(null); } }} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingMetricId} onOpenChange={(o) => !o && setDeletingMetricId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Metric?</AlertDialogTitle><AlertDialogDescription>This will remove this body metric record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletingMetricId && deleteMetricMutation.mutate(deletingMetricId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
