import { Link } from 'wouter'
import { FileText, Sparkles, Shield, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-br from-primary-50 to-white">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Intelligent Contract Management for Indian Businesses
              </h1>
              <p className="text-xl text-gray-600">
                Draft, analyze, and manage legal contracts with AI-powered insights tailored to Indian legal frameworks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contracts">Browse Templates</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-100 rounded-md p-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Contract Analysis</h3>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[85%]"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Risk Score</p>
                      <p className="text-lg font-semibold text-gray-900">Low</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Compliance</p>
                      <p className="text-lg font-semibold text-green-600">85%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Issues</p>
                      <p className="text-lg font-semibold text-amber-600">2</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-amber-800 font-medium mb-2">Suggested Improvements</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>Add dispute resolution clause</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>Clarify intellectual property rights</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 -bottom-10 -right-10 bg-primary-200 h-full w-full rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Legal Excellence</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines AI technology with legal expertise to provide comprehensive contract management solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600 mb-4">
                Get instant insights into your contracts with our AI that understands Indian legal contexts and requirements.
              </p>
              <Link href="/features" className="text-primary-600 font-medium inline-flex items-center hover:text-primary-700">
                Learn more <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Legal Compliance</h3>
              <p className="text-gray-600 mb-4">
                Ensure your contracts comply with Indian laws and regulations with automatic verification and checks.
              </p>
              <Link href="/features" className="text-primary-600 font-medium inline-flex items-center hover:text-primary-700">
                Learn more <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Network</h3>
              <p className="text-gray-600 mb-4">
                Connect with experienced lawyers for personalized advice and consultation on complex legal matters.
              </p>
              <Link href="/features" className="text-primary-600 font-medium inline-flex items-center hover:text-primary-700">
                Learn more <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-primary-900 text-white">
        <div className="container max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your legal operations?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Join thousands of Indian businesses using LexiDraft to create, manage, and optimize their legal contracts.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">Get Started For Free</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}