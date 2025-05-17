"use client"

import DashboardLayout from "@/layouts/DashboardLayout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Star,
  Download,
  CreditCard,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  HelpCircle,
  X,
} from "lucide-react"
import { PaymentType } from "@/types/payment"
import PaymentModal from "@/components/payment/PaymentModal"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface PlanFeature {
  title: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly"
  features: PlanFeature[]
  popular?: boolean
}

interface Subscription {
  planId: string
  status: "active" | "canceled" | "past_due"
  startDate: string
  endDate: string
  paymentMethod: string
  autoRenew: boolean
  usageStats?: {
    contracts: { used: number; total: number }
    storage: { used: number; total: number }
    consultations: { used: number; total: number }
  }
}

interface Invoice {
  id: string
  amount: number
  date: string
  status: "paid" | "pending" | "failed"
  description: string
  downloadUrl?: string
}

export default function Billing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const { toast } = useToast()

  const { data: subscription = null, isLoading: isLoadingSubscription } = useQuery<Subscription | null>({
    queryKey: ["/api/billing/subscription"],
    staleTime: 60000, // 1 minute
  })

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/billing/invoices"],
    staleTime: 60000, // 1 minute
  })

  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      description: "For individuals and freelancers getting started",
      price: billingCycle === "monthly" ? 999 : 9990,
      billingCycle,
      features: [
        { title: "Up to 5 contracts per month", included: true },
        { title: "Basic templates library", included: true },
        { title: "Limited Lexi AI assistance", included: true },
        { title: "Email support", included: true },
        { title: "Export to PDF", included: true },
        { title: "Advanced clause library", included: false },
        { title: "Client collaboration tools", included: false },
        { title: "Lawyer consultation credits", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "For small teams and growing businesses",
      price: billingCycle === "monthly" ? 2499 : 24990,
      billingCycle,
      features: [
        { title: "Unlimited contracts", included: true },
        { title: "Full template library", included: true },
        { title: "Unlimited Lexi AI assistance", included: true },
        { title: "Priority support", included: true },
        { title: "Export to PDF, DOCX, HTML", included: true },
        { title: "Advanced clause library", included: true },
        { title: "Client collaboration tools", included: true },
        { title: "2 lawyer consultation credits/month", included: true },
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For larger organizations with complex needs",
      price: billingCycle === "monthly" ? 4999 : 49990,
      billingCycle,
      features: [
        { title: "Unlimited contracts", included: true },
        { title: "Full template library + custom templates", included: true },
        { title: "Unlimited Lexi AI assistance", included: true },
        { title: "24/7 priority support", included: true },
        { title: "Advanced export options", included: true },
        { title: "Advanced clause library with custom additions", included: true },
        { title: "Advanced client collaboration tools", included: true },
        { title: "5 lawyer consultation credits/month", included: true },
      ],
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
        return "bg-emerald-50 text-emerald-600 border-emerald-200"
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-200"
      case "canceled":
      case "failed":
        return "bg-rose-50 text-rose-600 border-rose-200"
      case "past_due":
        return "bg-orange-50 text-orange-600 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
        return <CheckCircle className="h-3.5 w-3.5" />
      case "pending":
        return <Clock className="h-3.5 w-3.5" />
      case "canceled":
      case "failed":
        return <X className="h-3.5 w-3.5" />
      case "past_due":
        return <AlertCircle className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const handleChoosePlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = (data: any) => {
    toast({
      title: "Subscription Created",
      description: "Thank you for subscribing to LexiDraft!",
    })
    setPaymentModalOpen(false)
    // In a real application, you would refresh the subscription data here
  }

  // Get current plan details
  const currentPlan = subscription ? plans.find((p) => p.id === subscription.planId) : null

  // Calculate days remaining in subscription
  const getDaysRemaining = () => {
    if (!subscription) return 0

    const endDate = new Date(subscription.endDate)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining()

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="font-urbanist text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your subscription, billing information, and payment history
          </p>
        </div>

        <Tabs defaultValue="subscription" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-6 space-y-6">
            {isLoadingSubscription ? (
              <div className="h-48 animate-pulse rounded-lg bg-gray-200"></div>
            ) : subscription ? (
              <Card className="border-indigo-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Subscription</CardTitle>
                      <CardDescription>Your subscription details and billing information</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getStatusBadgeClasses(subscription.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(subscription.status)}
                      <span>{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-urbanist text-xl font-semibold">{currentPlan?.name || "Unknown Plan"}</h3>
                        <p className="mt-1 text-sm text-gray-500">{currentPlan?.description}</p>
                      </div>

                      <div className="mt-4 md:mt-0 text-right">
                        <div className="flex items-center justify-end">
                          <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentPlan?.price || 0)}</p>
                          <span className="ml-2 text-sm text-gray-500">
                            /{currentPlan?.billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-500">Next Billing Date</p>
                        <div className="mt-1 flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-500">Days Remaining</p>
                        <div className="mt-1 flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="font-medium">{daysRemaining} days</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-500">Payment Method</p>
                        <div className="mt-1 flex items-center">
                          <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="font-medium">{subscription.paymentMethod}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-500">Auto-renew</p>
                        <div className="mt-1 flex items-center">
                          <div
                            className={`h-4 w-8 rounded-full ${subscription.autoRenew ? "bg-emerald-500" : "bg-gray-300"} relative mr-2`}
                          >
                            <div
                              className={`absolute top-0.5 ${subscription.autoRenew ? "right-0.5" : "left-0.5"} h-3 w-3 rounded-full bg-white transition-all`}
                            ></div>
                          </div>
                          <p className="font-medium">{subscription.autoRenew ? "Enabled" : "Disabled"}</p>
                        </div>
                      </div>
                    </div>

                    {subscription.usageStats && (
                      <div className="space-y-4 pt-2">
                        <h4 className="font-medium text-gray-700">Resource Usage</h4>
                        <div className="space-y-4">
                          {/* Contracts Usage */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm text-gray-600">Contracts</p>
                              <p className="text-sm text-gray-600">
                                {subscription.usageStats.contracts.used} of {subscription.usageStats.contracts.total}
                              </p>
                            </div>
                            <Progress
                              value={
                                (subscription.usageStats.contracts.used / subscription.usageStats.contracts.total) * 100
                              }
                              className="h-2 bg-gray-100"
                              indicatorClassName="bg-indigo-500"
                            />
                          </div>

                          {/* Storage Usage */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm text-gray-600">Storage</p>
                              <p className="text-sm text-gray-600">
                                {subscription.usageStats.storage.used} of {subscription.usageStats.storage.total}MB
                              </p>
                            </div>
                            <Progress
                              value={
                                (subscription.usageStats.storage.used / subscription.usageStats.storage.total) * 100
                              }
                              className="h-2 bg-gray-100"
                              indicatorClassName="bg-purple-500"
                            />
                          </div>

                          {/* Consultation Credits */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm text-gray-600">Lawyer Consultation Credits</p>
                              <p className="text-sm text-gray-600">
                                {subscription.usageStats.consultations.used} of{" "}
                                {subscription.usageStats.consultations.total}
                              </p>
                            </div>
                            <Progress
                              value={
                                (subscription.usageStats.consultations.used /
                                  subscription.usageStats.consultations.total) *
                                100
                              }
                              className="h-2 bg-gray-100"
                              indicatorClassName="bg-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 bg-gray-50 border-t pt-4">
                  <div className="flex items-center text-sm text-gray-500 ">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    <span>
                      Need help with your subscription?{" "}
                      <a href="#" className="text-indigo-600 hover:underline">
                        Contact support
                      </a>
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                      Cancel Subscription
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">Manage Subscription</Button>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <div className="text-center py-12 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  You don't have an active subscription. Choose a plan below to get started with LexiDraft's powerful
                  legal tools.
                </p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  View Plans
                </Button>
              </div>
            )}

            <div id="plans-section" className="mt-12">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-urbanist text-xl font-semibold">Subscription Plans</h2>
                  <p className="mt-1 text-sm text-gray-600">Choose the perfect plan for your needs</p>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant={billingCycle === "monthly" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-md ${billingCycle === "monthly" ? "bg-white shadow-sm text-indigo-700" : "bg-transparent text-gray-600"}`}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={billingCycle === "yearly" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-md ${billingCycle === "yearly" ? "bg-white shadow-sm text-indigo-700" : "bg-transparent text-gray-600"}`}
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly
                    <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                      Save 15%
                    </Badge>
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden ${
                      plan.popular
                        ? "border-2 border-indigo-400 shadow-md"
                        : "border-gray-200 hover:border-indigo-200 hover:shadow-sm"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute right-0 top-0">
                        <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center">
                          <Star className="mr-1 h-3 w-3 fill-white" /> MOST POPULAR
                        </div>
                      </div>
                    )}

                    <CardHeader className={`pb-4 ${plan.popular ? "bg-indigo-50" : ""}`}>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>

                      <div className="mt-4 flex items-baseline">
                        <span className={`text-3xl font-bold ${plan.popular ? "text-indigo-600" : ""}`}>
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="ml-1 text-sm text-gray-500">
                          /{plan.billingCycle === "monthly" ? "month" : "year"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <span
                              className={`mr-2 mt-0.5 rounded-full p-0.5 ${
                                feature.included
                                  ? plan.popular
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "bg-emerald-100 text-emerald-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {feature.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </span>
                            <span className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-500"}`}>
                              {feature.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-2 pb-6">
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                            : "bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 hover:border-indigo-200"
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleChoosePlan(plan)}
                        disabled={subscription && subscription.planId === plan.id}
                      >
                        {subscription && subscription.planId === plan.id ? (
                          <span className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Current Plan
                          </span>
                        ) : (
                          "Choose Plan"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 p-6 shadow-md text-white">
              <div className="md:flex md:items-center md:justify-between">
                <div className="mb-4 md:mb-0 md:mr-8">
                  <h2 className="font-urbanist text-xl font-bold">Need a custom plan?</h2>
                  <p className="mt-2 text-sm text-gray-200">
                    Contact our sales team to create a tailored plan for your organization's specific needs.
                  </p>
                </div>
                <Button className="bg-white text-indigo-900 hover:bg-gray-100">Contact Sales</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {isLoadingInvoices ? (
              <div className="h-48 animate-pulse rounded-lg bg-gray-200"></div>
            ) : invoices && invoices.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoice History</CardTitle>
                      <CardDescription>Your past invoices and payment history</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm font-medium text-gray-500 bg-gray-50">
                          <th className="py-3 pl-6 pr-3">Invoice</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Amount</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right pr-6">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoices.map((invoice: Invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                </div>
                                <span>{invoice.description}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                              {formatCurrency(invoice.amount)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <Badge
                                variant="outline"
                                className={`${getStatusBadgeClasses(invoice.status)} flex items-center w-fit gap-1`}
                              >
                                {getStatusIcon(invoice.status)}
                                <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm pr-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                disabled={!invoice.downloadUrl}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between py-4 bg-gray-50 border-t">
                  <p className="text-sm text-gray-500">Showing {invoices.length} invoices</p>
                </CardFooter>
              </Card>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Your invoice history will appear here once you subscribe to a plan
                </p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  View Plans
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          paymentType={PaymentType.SUBSCRIPTION}
          amount={selectedPlan.price}
          title={`Subscribe to ${selectedPlan.name} Plan`}
          description={`${selectedPlan.billingCycle === "monthly" ? "Monthly" : "Yearly"} subscription to LexiDraft ${selectedPlan.name} plan`}
          buttonText="Subscribe Now"
          details={{
            planId: selectedPlan.id,
            billingCycle: selectedPlan.billingCycle,
          }}
        />
      )}
    </DashboardLayout>
  )
}
