import Link from 'next/link';
import { ArrowRight, QrCode, Link as LinkIcon, Zap, Globe, BarChart3 } from 'lucide-react';

export default function MerchantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/merchant/dashboard" className="btn-primary">Dashboard</Link>
          </div>
        </nav>
      </header>

      <section className="bg-gradient-to-br from-primary to-emerald-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Accept AxCNH Payments
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Let your customers pay with Chinese Yuan stablecoin. Instant settlement to your Conflux wallet.
          </p>
          <Link href="/merchant/register" className="bg-white text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Accept Payments Your Way</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 border-2 border-gray-100 rounded-2xl hover:border-primary transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">QR Code Payments</h3>
              <p className="text-gray-600">
                Generate QR codes for your POS. Customers scan and pay with their wallet.
              </p>
            </div>
            <div className="text-center p-8 border-2 border-gray-100 rounded-2xl hover:border-primary transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Payment Links</h3>
              <p className="text-gray-600">
                Create shareable links for online payments, invoices, or social media.
              </p>
            </div>
            <div className="text-center p-8 border-2 border-gray-100 rounded-2xl hover:border-primary transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Settlement</h3>
              <p className="text-gray-600">
                Get paid instantly. No waiting days for bank transfers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Real-Time Dashboard</h2>
              <p className="text-gray-600 text-lg mb-6">
                Track all your transactions, sales volume, and customer payments in one place.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Real-time sales analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Multi-currency display (AxCNH/KES/USD)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Instant payment notifications</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Today's Sales</span>
                  <span className="text-2xl font-bold text-green-600">1,245 AxCNH</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-blue-600">45 AxCNH</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Volume</span>
                  <span className="text-2xl font-bold">12,450 AxCNH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-8 opacity-90">Set up your merchant account in minutes</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/register" className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
              Register Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/merchant/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2">
              Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© 2026 AxPesa. Built on Conflux Network.</p>
      </footer>
    </div>
  );
}
