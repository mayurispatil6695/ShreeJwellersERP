import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Download, Calendar, IndianRupee, Users, CheckCircle, Clock } from "lucide-react";

const payrollData = [
  { id: 1, name: "Amit Kumar", role: "Store Manager", salary: "₹85,000", bonus: "₹12,000", deductions: "₹8,500", net: "₹88,500", status: "Paid" },
  { id: 2, name: "Sunita Devi", role: "Sr. Sales Associate", salary: "₹45,000", bonus: "₹5,000", deductions: "₹4,500", net: "₹45,500", status: "Paid" },
  { id: 3, name: "Rahul Verma", role: "Inventory Manager", salary: "₹55,000", bonus: "₹8,000", deductions: "₹5,500", net: "₹57,500", status: "Pending" },
  { id: 4, name: "Meera Patel", role: "Goldsmith", salary: "₹65,000", bonus: "₹15,000", deductions: "₹6,500", net: "₹73,500", status: "Paid" },
  { id: 5, name: "Kiran Shah", role: "Accountant", salary: "₹48,000", bonus: "₹4,000", deductions: "₹4,800", net: "₹47,200", status: "Pending" },
];

const Payroll = () => {
  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in pt-2 sm:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              <span className="text-gradient-gold">Payroll</span> Management
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Process salaries, bonuses, and manage employee compensation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">January 2024</span>
              <span className="sm:hidden">Jan 24</span>
            </Button>
            <Button variant="gold" size="sm" className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card variant="stat">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" />
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Payroll</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">₹28.5L</p>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <p className="text-xs sm:text-sm text-muted-foreground">Employees</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold">48</p>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
              <p className="text-xs sm:text-sm text-muted-foreground">Processed</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-500">42</p>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
              <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-yellow-500">6</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Payroll Details
            </CardTitle>
            <Button variant="gold" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Process All Pending
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payrollData.map((emp) => (
              <div 
                key={emp.id} 
                className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                {/* Employee Info */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{emp.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{emp.role}</p>
                  </div>
                  <Badge 
                    variant={emp.status === "Paid" ? "default" : "secondary"}
                    className="text-xs whitespace-nowrap shrink-0"
                  >
                    {emp.status}
                  </Badge>
                </div>
                
                {/* Salary Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Salary</p>
                    <p className="font-medium">{emp.salary}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bonus</p>
                    <p className="font-medium text-green-500">{emp.bonus}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductions</p>
                    <p className="font-medium text-red-500">{emp.deductions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Pay</p>
                    <p className="font-bold text-primary">{emp.net}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Payroll;
