import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Smartphone, Shield, Zap, CreditCard, Building2, Globe, Download, CheckCircle, Phone, Droplet, TrendingUp, Users, Wallet, Send } from 'lucide-react';
import Header from '@/components/Header';
import StakingStats from '@/components/StakingStats';

const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse bg-gray-700 rounded-full w-96 h-96" />
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section with Globe */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[128px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-full mb-6">
                <Globe className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">African Finance, Evolved</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Money,<br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Multiple Options
                </span>
              </h1>
              
              <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-xl mx-auto lg:mx-0">
                Expand your currency options beyond USD. Save, send, and receive Chinese Yuan stablecoins. 
                Buy with M-PESA, cards, or mobile money. Transfer to friends instantly. Built on Conflux blockchain.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link 
                  href="/buy" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Buy AxCNH
                </Link>
                <Link 
                  href="/transfer" 
                  className="bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send AxCNH
                </Link>
              </div>
              
              <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>No KYC required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Instant settlement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Multiple currencies</span>
                </div>
              </div>
            </div>
            
            {/* Right: Globe */}
            <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
              <Globe3D />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">24/7</p>
              <p className="text-gray-400">Always Available</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">60sec</p>
              <p className="text-gray-400">Average Settlement</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-pink-400 mb-2">0.5%</p>
              <p className="text-gray-400">Transaction Fee</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">3+</p>
              <p className="text-gray-400">Currency Options</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Staking Stats Section */}
      <StakingStats />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Expand Your Options</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Access multiple currencies beyond USD. Save in CNY, send anywhere, receive payments globally.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Smartphone, 
                title: 'Choose Payment', 
                desc: 'Pay with M-PESA, Visa, Mastercard, or bank transfer',
                color: 'purple'
              },
              { 
                icon: Globe, 
                title: 'Access CNY', 
                desc: 'Hold and transfer Chinese Yuan stablecoins. Multiple options, one platform.',
                color: 'pink'
              },
              { 
                icon: Zap, 
                title: 'Instant Transfer', 
                desc: 'Send to anyone, anywhere in seconds. No borders, no limits.',
                color: 'emerald'
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Payment Methods</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Multiple ways to fund your crypto transactions
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, name: 'M-PESA', countries: 'Kenya, Tanzania, Uganda', color: 'emerald' },
              { icon: Globe, name: 'Alipay/WeChat', countries: 'China', color: 'blue' },
              { icon: CreditCard, name: 'Cards', countries: 'Visa, Mastercard, Amex', color: 'purple' },
              { icon: Building2, name: 'Bank Transfer', countries: 'NG, KE, UG, ZA, GH, CN', color: 'slate' },
            ].map((method, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-xl transition-shadow border border-gray-100">
                <div className={`w-12 h-12 bg-${method.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <method.icon className={`w-6 h-6 text-${method.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold mb-1">{method.name}</h3>
                <p className="text-gray-500 text-sm">{method.countries}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stablecoins Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Multiple Currency Options</h2>
          <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Expand beyond USD. Trade stablecoins pegged to major world currencies.
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { symbol: 'AxCNH', name: 'Chinese Yuan', icon: '¥', color: 'red' },
              { symbol: 'USDTO', name: 'US Dollar', icon: '$', color: 'emerald' },
              { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'orange' },
              { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'purple' },
            ].map((token, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors border border-white/20">
                <div className={`w-14 h-14 bg-${token.color}-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold`}>
                  {token.icon}
                </div>
                <h3 className="text-xl font-bold mb-1">{token.symbol}</h3>
                <p className="text-sm opacity-80">{token.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Login Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔐</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Get Started with Social Login</h2>
            <p className="text-xl mb-8 text-gray-400">
              Sign in with Google, Twitter, Discord, or other social accounts. No browser extension needed.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 bg-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-400 transition-colors"
            >
              <span className="text-2xl">🔐</span> Login
            </Link>
          </div>
        </div>
      </section>

      {/* Merchants Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">For Merchants</h2>
          <p className="text-xl mb-12 opacity-90">
            Accept stablecoin payments from China and Africa in your store or online
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            {[
              { title: 'QR Code Terminal', desc: 'Generate QR codes for customers to scan and pay', icon: Smartphone },
              { title: 'Payment Links', desc: 'Create shareable links for online payments', icon: Globe },
              { title: 'Instant Settlement', desc: 'Receive stablecoins directly to your wallet', icon: Zap },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link 
            href="/merchant" 
            className="inline-block bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            Start Accepting Crypto
          </Link>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get the Mobile App</h2>
              <p className="text-xl text-gray-600 mb-8">
                Trade stablecoins on the go with the AxPesa mobile app. Available for Android on Google Play Store.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Real-time China-Africa exchange rates',
                  'Instant M-PESA & Alipay integration',
                  'Push notifications for transactions',
                  'Merchant POS terminal',
                  'Biometric security',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/AxPesa.apk" 
                  className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download APK
                </Link>
                <Link 
                  href="https://play.google.com/store" 
                  target="_blank"
                  className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  Google Play
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 md:w-80 h-[450px] md:h-[550px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-4 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[2.5rem] flex items-center justify-center">
                    <div className="text-center text-white">
                      <Globe className="w-20 h-20 mx-auto mb-4 animate-pulse" />
                      <p className="text-2xl font-bold">AxPesa</p>
                      <p className="opacity-80">Africa-China Bridge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white">AxPesa</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="/buy" className="hover:text-white transition-colors">Buy</Link>
              <Link href="/sell" className="hover:text-white transition-colors">Sell</Link>
              <Link href="/transfer" className="hover:text-white transition-colors">Send</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
            <div className="flex gap-4">
              <Link href="/AxPesa.apk" className="hover:text-white flex items-center gap-1">
                <Download className="w-4 h-4" /> Android
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 AxPesa. African Finance, Evolved.</p>
            <p className="mt-2 text-xs text-gray-500">
              Built on Conflux Network - Expanding currency options for Africa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
