// src/pages/LandingPage.jsx
// Public landing page with editorial layout following DESIGN.md.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCrops } from '../api/crops';
import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import { Activity, CloudSun, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getCrops()
      .then((data) => {
        if (isMounted) {
          setCrops(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCrops([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingCrops(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getRoleHome = () => {
    if (!user) return '/app/dashboard';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'buyer') return '/app/marketplace';
    return '/app/dashboard';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-gray-900">
      {/* Public Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-serif text-xl font-semibold text-green-900">
              icagria
            </Link>
            <nav aria-label="Landing navigation" className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="#features" className="hover:text-green-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-green-900 transition-colors">
                How it works
              </a>
              <a href="#crop-guide" className="hover:text-green-900 transition-colors">
                Crops
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={getRoleHome()}>
                <Button variant="primary" size="sm" arrow>
                  Open app
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-green-900 transition-colors px-2 py-1">
                  Log in
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section (a): Hero */}
        <section className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 text-center flex flex-col items-center">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
              Digital Platform for Smallholders
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-green-900 leading-[1.15] max-w-4xl tracking-tight">
              Know your soil. Plan with the weather. Sell your harvest.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
              An all-in-one agronomic workspace tailored for smallholder tuber and legume farmers.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Link to={getRoleHome()}>
                  <Button variant="primary" size="lg" arrow>
                    Open app
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="primary" size="lg">
                      Get started
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section (b): What icagria does */}
        <section id="features" className="border-b border-gray-200 py-20 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">Capabilities</p>
              <h2 className="font-serif text-3xl font-semibold text-green-900">What icagria does</h2>
              <p className="mt-2 text-gray-600">
                Core agronomic and commercial tools to support every stage of your planting cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <article className="border border-gray-200 bg-white rounded overflow-hidden flex flex-col">
                <div className="aspect-[3/2] bg-green-100 flex flex-col items-center justify-center text-green-800">
                  <Activity size={36} aria-hidden="true" />
                  <span className="mt-2 text-xs font-serif font-semibold tracking-wide uppercase">Soil Sensor</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">Agronomy</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Soil pH monitoring</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Track real-time acidity levels in your plots, test against crop tolerance thresholds, and prevent nutrient lock.
                  </p>
                </div>
              </article>

              {/* Feature 2 */}
              <article className="border border-gray-200 bg-white rounded overflow-hidden flex flex-col">
                <div className="aspect-[3/2] bg-green-100 flex flex-col items-center justify-center text-green-800">
                  <CloudSun size={36} aria-hidden="true" />
                  <span className="mt-2 text-xs font-serif font-semibold tracking-wide uppercase">Atmospheric Data</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">Forecast</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Weather for your farm</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Localized temperature, humidity, rainfall probabilities, and 7-day outlooks tailored to your farm coordinates.
                  </p>
                </div>
              </article>

              {/* Feature 3 */}
              <article className="border border-gray-200 bg-white rounded overflow-hidden flex flex-col">
                <div className="aspect-[3/2] bg-green-100 flex flex-col items-center justify-center text-green-800">
                  <BookOpen size={36} aria-hidden="true" />
                  <span className="mt-2 text-xs font-serif font-semibold tracking-wide uppercase">Plot Records</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">Management</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Farm and crop records</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Organize plots, log planting schedules, track variety batches, and automatically project expected harvest dates.
                  </p>
                </div>
              </article>

              {/* Feature 4 */}
              <article className="border border-gray-200 bg-white rounded overflow-hidden flex flex-col">
                <div className="aspect-[3/2] bg-green-100 flex flex-col items-center justify-center text-green-800">
                  <ShoppingBag size={36} aria-hidden="true" />
                  <span className="mt-2 text-xs font-serif font-semibold tracking-wide uppercase">Direct Trade</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">Commerce</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Harvest marketplace</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    List upcoming or ready harvests directly to registered food buyers and restaurants with clear pricing and inquiry tracking.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Section (c): How it works */}
        <section id="how-it-works" className="border-b border-gray-200 py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-14">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">Workflow</p>
              <h2 className="font-serif text-3xl font-semibold text-green-900">How it works</h2>
              <p className="mt-2 text-gray-600">Three straightforward steps from soil preparation to harvest sales.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border border-gray-200 rounded p-6 bg-white">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-green-100 text-green-900 font-serif font-semibold text-sm mb-4">
                  1
                </span>
                <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Add your farm and crops</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Record your plot area, farm location, and select your primary crops and seed varieties.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-6 bg-white">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-green-100 text-green-900 font-serif font-semibold text-sm mb-4">
                  2
                </span>
                <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Watch your soil pH and the weather</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Monitor pH suitability curves and local weather forecasts to time fertilization, irrigation, and fieldwork.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-6 bg-white">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-green-100 text-green-900 font-serif font-semibold text-sm mb-4">
                  3
                </span>
                <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">List your harvest for buyers</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Publish available quantities directly on the marketplace, answer buyer inquiries, and confirm bookings.
                </p>
              </div>
            </div>

            {/* Honest note alert box */}
            <div className="mt-10 border border-green-200 bg-green-50/70 rounded p-4 flex items-start gap-3">
              <span className="text-green-800 text-sm font-semibold uppercase tracking-wider shrink-0 mt-0.5">Note:</span>
              <p className="text-sm text-green-900 leading-relaxed">
                Sensor readings are simulated in this demo; the system is designed to accept real devices later.
              </p>
            </div>
          </div>
        </section>

        {/* Section (d): Crops in the guide */}
        <section id="crop-guide" className="border-b border-gray-200 py-20 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">Botanical Reference</p>
                <h2 className="font-serif text-3xl font-semibold text-green-900">Crops in the guide</h2>
                <p className="mt-2 text-gray-600">Standard reference profiles for tuber and legume varieties.</p>
              </div>
              {user?.role === 'farmer' && (
                <Link to="/app/crops" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900 transition-colors">
                  Open full crop guide <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {loadingCrops ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height="h-32" />
                ))}
              </div>
            ) : crops.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No crops currently published in the catalog.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {crops.map((c) => (
                  <article key={c._id} className="border border-gray-200 bg-white rounded p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Badge variant={c.type === 'tuber' ? 'default' : 'outline'} className="capitalize text-[10px]">
                          {c.type}
                        </Badge>
                      </div>
                      <h3 className="font-serif font-semibold text-gray-900 text-sm leading-snug">
                        {c.name}
                      </h3>
                      {c.scientificName && (
                        <p className="text-[11px] italic text-gray-500 truncate mt-0.5">{c.scientificName}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">indicative range</p>
                      <p className="text-xs font-semibold text-green-900 mt-0.5">
                        pH {c.phMin} – {c.phMax}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section (e): Closing CTA */}
        <section className="py-20 bg-white text-center">
          <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-green-900 max-w-xl leading-tight">
              Ready to manage your soil and farm harvests?
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-md">
              Get started with farm records, weather planning, and harvest listings tailored for smallholders.
            </p>
            <div className="mt-8 flex items-center gap-4">
              {user ? (
                <Link to={getRoleHome()}>
                  <Button variant="primary" size="lg" arrow>
                    Go to your dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="primary" size="lg">
                      Create account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Section (f): Footer */}
      <Footer />
    </div>
  );
}
