import Link from 'next/link';
import {
  MessageCircle,
  Users,
  ShoppingCart,
  Wallet,
  Bell,
  Smartphone,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Micro-CRM WhatsApp pour commerçants
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            ReliaPay
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Gérez vos clients, suivez vos commandes, enregistrez les paiements
            et relancez en un tap sur WhatsApp.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base sm:w-auto">
                Créer un compte gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full text-base sm:w-auto"
              >
                Se connecter
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-3xl">
          <Card className="grid grid-cols-3 divide-x divide-border p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground sm:text-3xl">
                0 FCFA
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Pour commencer
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground sm:text-3xl">
                1 tap
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Pour relancer
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground sm:text-3xl">
                100%
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Vos données privées
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Tout ce qu'il vous faut pour suivre vos ventes à crédit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Users,
                title: 'Gestion des clients',
                desc: 'Créez des fiches clients avec numéro WhatsApp et tags. Retrouvez-les en un instant.',
              },
              {
                icon: ShoppingCart,
                title: 'Commandes simples',
                desc: 'Enregistrez une commande avec un produit ou un montant libre. Le solde se calcule seul.',
              },
              {
                icon: Wallet,
                title: 'Suivi des paiements',
                desc: 'Enregistrez chaque paiement. Le solde et le statut se mettent à jour automatiquement.',
              },
              {
                icon: Bell,
                title: 'Relances programmées',
                desc: 'Programmez une relance à J+3 ou J+7. Soyez notifié le jour venu.',
              },
              {
                icon: MessageCircle,
                title: 'Relance WhatsApp en 1 tap',
                desc: `Un message prérempli avec le montant dû s'ouvre dans WhatsApp. Vous n'avez plus qu'à appuyer sur Envoyer.`,
              },
              {
                icon: Shield,
                title: 'Données protégées',
                desc: 'Chaque commerçant ne voit que ses propres clients et commandes. Isolation totale.',
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Comment ça marche
          </h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Créez un compte',
                desc: 'Inscrivez-vous avec votre email en 30 secondes.',
              },
              {
                step: '2',
                title: 'Ajoutez un client et une commande',
                desc: 'Saisissez le nom, le numéro WhatsApp et le montant de la commande.',
              },
              {
                step: '3',
                title: 'Enregistrez les paiements',
                desc: 'Le solde se recalcule automatiquement après chaque paiement.',
              },
              {
                step: '4',
                title: 'Relancez sur WhatsApp',
                desc: `Touchez "Relancer". WhatsApp s'ouvre avec le message prérempli. Appuyez sur Envoyer.`,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Prêt à suivre vos ventes ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/90">
              Rejoignez les commerçants qui ne perdent plus le fil de leurs
              créances.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full text-base sm:w-auto"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>ReliaPay — Micro-CRM WhatsApp</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Mobile-first
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              PWA installable
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Données isolées
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
