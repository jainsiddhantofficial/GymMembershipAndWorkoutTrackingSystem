import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTodayAttendance, getAttendance, getMembers, checkIn, checkOut, deleteAttendance, getAttendanceStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, LogOut, MoreHorizontal, Users, Clock, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const [selectedMember, setSelectedMember] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState("today");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayAttendance, isLoading: loadingToday } = useQuery({ queryKey: ["attendance-today"], queryFn: getTodayAttendance });
  const { data: allAttendance, isLoading: loadingAll } = useQuery({ queryKey: ["attendance-all"], queryFn: getAttendance, enabled: tab === "all" });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const { data: stats } = useQuery({ queryKey: ["attendance-stats"], queryFn: getAttendanceStats });

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(selectedMember, "MANUAL"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Checked in successfully" });
      setSelectedMember("");
    },
    onError: (e: any) => toast({ title: "Check-in failed", description: e.message, variant: "destructive" }),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-all"] });
      toast({ title: "Checked out" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-all"] });
      toast({ title: "Record deleted" });
      setDeletingId(null);
    },
  });

  const currentAttendance = tab === "today" ? todayAttendance : allAttendance;
  const isLoading = tab === "today" ? loadingToday : loadingAll;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Track member check-ins and check-outs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Check-ins</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayAttendance?.length ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently In</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayAttendance?.filter((a: any) => !a.checkOutTime).length ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalAttendance ?? "—"}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Check-In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="flex-1 max-w-xs" data-testid="select-checkin-member">
                <SelectValue placeholder="Select member to check in" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => checkInMutation.mutate()} disabled={!selectedMember || checkInMutation.isPending} data-testid="button-checkin">
              <LogIn className="w-4 h-4 mr-2" />Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All Records</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : !currentAttendance?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No attendance records.</TableCell></TableRow>
                  ) : currentAttendance.map((a: any) => {
                    const checkInTime = a.checkInTime ? new Date(a.checkInTime) : null;
                    const checkOutTime = a.checkOutTime ? new Date(a.checkOutTime) : null;
                    const duration = checkInTime && checkOutTime ? Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000) : null;
                    const member = members?.find((m: any) => m.id === (a.member?.id || a.memberId));
                    return (
                      <TableRow key={a.id} data-testid={`row-attendance-${a.id}`}>
                        <TableCell className="font-medium">{member ? `${member.firstName} ${member.lastName}` : a.memberId}</TableCell>
                        <TableCell className="text-sm">{checkInTime?.toLocaleTimeString()}</TableCell>
                        <TableCell className="text-sm">{checkOutTime ? checkOutTime.toLocaleTimeString() : <Badge variant="secondary" className="text-xs">Still in</Badge>}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.checkInMethod?.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{duration != null ? `${duration}m` : "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!a.checkOutTime && <DropdownMenuItem onClick={() => checkOutMutation.mutate(a.id.toString())}><LogOut className="w-3.5 h-3.5 mr-2" />Check Out</DropdownMenuItem>}
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(a.id.toString())}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>This will remove this attendance record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
