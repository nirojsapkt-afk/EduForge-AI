import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Check, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out EduForge AI',
    icon: Zap,
    features: [
      '5 generations per day',
      'Worksheet generator',
      'Quiz generator',
      'Lesson builder',
      'Copy to clipboard',
      'PDF download',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For serious educators who need unlimited access',
    icon: Crown,
    features: [
      'Unlimited generations',
      'All Free features',
      'Priority AI processing',
      'Custom formatting options',
      'Generation history',
      'Email support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in" data-testid="pricing-page">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: 'Outfit' }}>
          Simple, transparent pricing
        </h1>
        <p className="text-base text-slate-400 max-w-lg mx-auto">
          Start free. Upgrade when you need more. No hidden fees, no surprises.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto" data-testid="pricing-cards">
        {plans.map((plan) => (
          <div
            key={plan.name}
            data-testid={`pricing-card-${plan.name.toLowerCase()}`}
            className={`relative rounded-2xl p-8 transition-all duration-300 ${
              plan.highlight
                ? 'bg-white/[0.04] border-2 border-violet-500/50 animate-pulse-glow'
                : 'bg-white/[0.02] border border-white/[0.06]'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-violet-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                plan.highlight ? 'bg-violet-600' : 'bg-white/5'
              }`}>
                <plan.icon size={20} className={plan.highlight ? 'text-white' : 'text-slate-400'} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{plan.name}</h3>
              <p className="text-sm text-slate-400">{plan.description}</p>
            </div>

            <div className="mb-6">
              <span className={`text-4xl font-bold ${plan.highlight ? 'gradient-text' : 'text-white'}`} style={{ fontFamily: 'Outfit' }}>
                {plan.price}
              </span>
              <span className="text-slate-500 text-sm">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className={plan.highlight ? 'text-violet-400' : 'text-slate-500'} />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                if (!user) navigate('/auth');
                else if (plan.highlight) {
                  alert('Pro upgrade coming soon! Thank you for your interest.');
                }
              }}
              data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
              className={`w-full rounded-xl py-2.5 font-medium ${
                plan.highlight
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
              }`}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center" data-testid="pricing-faq">
        <p className="text-sm text-slate-500">
          Questions? Contact us at <span className="text-violet-400">support@eduforge.ai</span>
        </p>
      </div>
    </div>
  );
}
