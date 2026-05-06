import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { getAll, addItem, updateItem, deleteItem, getByField } from "@/lib/firebaseDb";
import { toast } from "sonner";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  User, 
  MoreHorizontal, 
  Search,
  UserPlus,
  UserMinus,
  Crown,
  AlertTriangle,
  Trash2,
  IdCard,
} from "lucide-react";
import { format } from "date-fns";
import { EmployeeManagement } from "@/components/admin/EmployeeManagement";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
}

const ITEMS_PER_PAGE = 10;

const Admin = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleAction, setRoleAction] = useState<{ role: AppRole; action: 'add' | 'remove' } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch from Firebase RTDB
      const profiles = await getAll<any>('profiles');
      const roles = await getAll<any>('user_roles');

      const mappedUsers: AdminUser[] = profiles.map((p: any) => ({
        id: p.user_id || p.id,
        email: p.email || 'N/A',
        created_at: p.created_at || new Date().toISOString(),
        last_sign_in_at: null,
        display_name: p.display_name || null,
        avatar_url: p.avatar_url || null,
        roles: roles.filter((r: any) => r.user_id === (p.user_id || p.id)).map((r: any) => r.role as AppRole),
      }));

      // Ensure at least user role for all
      mappedUsers.forEach(u => { if (u.roles.length === 0) u.roles = ['user']; });
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !roleAction) return;
    try {
      setUpdating(true);
      if (roleAction.action === 'add') {
        await addItem('user_roles', { user_id: selectedUser.id, role: roleAction.role });
      } else {
        const existing = await getByField<any>('user_roles', 'user_id', selectedUser.id);
        const toRemove = existing.find((r: any) => r.role === roleAction.role);
        if (toRemove) await deleteItem('user_roles', toRemove.id);
      }
      toast.success(`Successfully ${roleAction.action === 'add' ? 'added' : 'removed'} ${roleAction.role} role`);
      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const openRoleDialog = (user: AdminUser, role: AppRole, action: 'add' | 'remove') => {
    setSelectedUser(user);
    setRoleAction({ role, action });
    setRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setDeleting(true);
      // Remove user roles and profile from Firebase
      const roles = await getByField<any>('user_roles', 'user_id', selectedUser.id);
      for (const r of roles) await deleteItem('user_roles', r.id);
      const profiles = await getByField<any>('profiles', 'user_id', selectedUser.id);
      for (const p of profiles) await deleteItem('profiles', p.id);
      
      toast.success(`Successfully deleted user ${selectedUser.display_name || selectedUser.email}`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="gap-1"><Crown className="w-3 h-3" />Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" />Moderator</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><User className="w-3 h-3" />User</Badge>;
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    moderators: users.filter(u => u.roles.includes('moderator')).length,
    regularUsers: users.filter(u => !u.roles.includes('admin') && !u.roles.includes('moderator')).length,
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in pt-2 sm:pt-0 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            <span className="text-gradient-gold">Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage users, employees, and system settings
          </p>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              Employee Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.moderators}</p>
                  <p className="text-xs text-muted-foreground">Moderators</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <User className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.regularUsers}</p>
                  <p className="text-xs text-muted-foreground">Regular Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage user roles</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Sign In</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((adminUser) => (
                          <TableRow key={adminUser.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={adminUser.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {(adminUser.display_name || adminUser.email || '?')[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {adminUser.display_name || 'No name'}
                                    {adminUser.id === user?.uid && (
                                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {adminUser.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {adminUser.roles.map((role) => (
                                  <span key={role}>{getRoleBadge(role)}</span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {format(new Date(adminUser.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {adminUser.last_sign_in_at 
                                ? format(new Date(adminUser.last_sign_in_at), 'MMM d, yyyy h:mm a')
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Manage Roles</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {!adminUser.roles.includes('admin') ? (
                                    <DropdownMenuItem onClick={() => openRoleDialog(adminUser, 'admin', 'add')}>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Make Admin
                                    </DropdownMenuItem>
                                  ) : adminUser.id !== user?.uid && (
                                    <DropdownMenuItem 
                                      onClick={() => openRoleDialog(adminUser, 'admin', 'remove')}
                                      className="text-destructive"
                                    >
                                      <UserMinus className="w-4 h-4 mr-2" />
                                      Remove Admin
                                    </DropdownMenuItem>
                                  )}
                                  {!adminUser.roles.includes('moderator') ? (
                                    <DropdownMenuItem onClick={() => openRoleDialog(adminUser, 'moderator', 'add')}>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Make Moderator
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => openRoleDialog(adminUser, 'moderator', 'remove')}
                                      className="text-destructive"
                                    >
                                      <UserMinus className="w-4 h-4 mr-2" />
                                      Remove Moderator
                                    </DropdownMenuItem>
                                  )}
                                  {adminUser.id !== user?.uid && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openDeleteDialog(adminUser)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {[...Array(totalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              isActive={currentPage === i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <EmployeeManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Confirmation Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleAction?.action === 'add' ? 'Add' : 'Remove'} {roleAction?.role} Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {roleAction?.action === 'add' ? 'grant' : 'revoke'} the{' '}
              <strong>{roleAction?.role}</strong> role {roleAction?.action === 'add' ? 'to' : 'from'}{' '}
              <strong>{selectedUser?.display_name || selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button 
              variant={roleAction?.action === 'remove' ? 'destructive' : 'default'}
              onClick={handleRoleChange}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete the user{' '}
              <strong>{selectedUser?.display_name || selectedUser?.email}</strong>?
              <br /><br />
              This action cannot be undone. All user data including their profile, preferences, and roles will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Admin;
