import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { TeamCard } from '../components/TeamCard'
import { teamsByGroup } from '../data/teams'
import { club } from '../data/club'

const intro = "Leuven Bears On Wheels ( of kortweg LBOW ) en Junior Bears on Wheels zetten zich al jaren volop in voor een voorlichtingsproject waarbij een docent aan de leerlingen van een klas laat zien én vooral ervaren hoe het is om een fysieke handicap te hebben. Leerlingen leren daardoor spelenderwijs dat, als je een handicap hebt, zeer veel mogelijk blijft ! Ze ondervinden aan de lijve hoe het voelt om in een rolstoel te zitten en te bewegen . Ze gaan de uitdaging met elkaar aan tijdens een partijtje rolstoelbasketbal. Ook treden ze, na het bekijken van indrukwekkende acties en voorbeelden, met elkaar in discussie over hoe het zou zijn om met een beperking te leven."

const visie = "Ons programma is gericht op het in de klas bespreekbaar maken van aangepaste sporten voor jongeren met en zonder beperking. Een voorlichtingsproject waarbij trainers en onze eigen jeugdspelers laten zien en ervaren hoe het is om te sporten met een handicap en de leerlingen spelenderwijs aan te leren dat je met een rolstoel nog vele mogelijkheden overhoudt om te bewegen en individueel te sporten of in teamverband. De deelnemers leren zorg dragen voor de lichamelijke en psychische gezondheid van henzelf en anderen"

const visieBullets = [
  "De leerlingen laten ervaren hoe je basketbal kan spelen in en met een sportrolstoel.",
  "De deelnemers leren zorg dragen voor de lichamelijke en psychische gezondheid van\n henzelf en\n anderen",
  "Deelnemers leren zich dus gedragen met respect voor normen en waarden."
]

const inclusie = "Jongeren en studenten bewuster maken aangaande het aspect \"hoe actief leven met een handicap\" is een grote doelstelling. Onze sporters worden soms nagekeken op straat omdat ze anders zouden zijn.....maar dat zijn ze net niet! Door het bezoeken van onze doelgroep - de jongeren van lagere en middelbare scholen, hogescholen en universiteiten - maken we dit tastbaar en bespreekbaar . LBOW komt zelf naar de scholen, hogescholen en universiteiten .We vinden het belangrijk dat iedereen, ook zij die geen beperking hebben, kunnen kennismaken met het rolstoelbasketbal. LBOW zet zich zo ten volle in om de drempel, die vaak bestaat tussen kinderen met en zonder beperking, tot een minimum te herleiden en zet hen aan om zich bij een sportclub aan te sluiten. Inclusie werkt inderdaad in beide richtingen. Binnen de werking van de Junior Bears on Wheels, hebben we geleerd om naar de vaak jonge sporter met een beperking te kijken door een sportbril en zeker niet door een gehandicaptenbril. We confronteren onze leden niet met hun beperking maar leren ze juist hun mogelijkheden. beter te benutten. We wakkeren hun enthousiasme aan en vormen één groot team dat elkaar door dik en dun steunt, zowel voor, tijdens als na de rolstoelbasketwedstrijd . “ One team “, ook samen met onze oudere spelers . Dat we hun kwaliteiten laten primeren, komt niet alleen ten goede aan het sportgebeuren, het vergroot ook hun algemeen zelfvertrouwen. Zo helpen we ze om later hun plek als volwaardig persoon in de maatschappij makkelijker in te nemen. Dit laatste beschouwen we als ons hogere sociale doel."

const werkwijzeIntro = "Wij komen ter plaatse met sportrolstoelen die aangepast zijn voor het basketten: Wij kunnen 12 sportrolstoelen laden in onze aangepaste bus Grootte van de sportrolstoelen aangepast aan de leeftijd Ballen en klein materiaal worden voorzien Hesjes zijn beschikbaar Wij geven info over de sport zelf en de sportrolstoelen. Afhankelijk van de groep geven we meer duiding over types handicap en voorzien we een demonstratie."

const werkwijzeBullets = [
  "Wij kunnen 12 sportrolstoelen laden in onze aangepaste bus",
  "Grootte van de sportrolstoelen aangepast aan de leeftijd",
  "Ballen en klein materiaal worden voorzien",
  "Hesjes zijn beschikbaar",
  "Handling van de bal en passes geven",
  "Rijden en sturen met en zonder de bal",
  "Klein parcours om beweeglijkheid aan te tonen",
  "Layup en shot als oefening"
]

const werkwijzePractice = "Wij laten de leerlingen vooral de praktijk beoefenen: Handling van de bal en passes geven Rijden en sturen met en zonder de bal Klein parcours om beweeglijkheid aan te tonen Layup en shot als oefening"

const funOnWheels = "FUN ON WHEELS wordt een evenement dat basket, sensibilisering en plezier combineert. Een rolstoelbasketter speelt mee met vier niet-rolstoelbasketballers die voor deze gelegenheid wel in een rolstoel zullen plaatsnemen. De rolstoelbasketter mag de ploeg leiden en zorgen voor goeie passen en organiseren van het spel maar mag zelf niet scoren. De niet-rolstoelbasketters leren met een sportrolstoel maneuvreren en ervaren hoe het is om deze sport te beoefenen in een geest van openheid en vriendschappelijke sportiviteit. Met een aangepast reglement spelen we enkele korte wedstrijdjes in een knock-out formule. Sfeer snuiven? Hier nog even de link met de foto's van vorig jaar, altijd leuk om terug te zien: Rolstoelbasket ... een ervaring rijker en gegarandeerd met veel plezier !"

const testimonials: { quote: string; by: string }[] = [
  {
    "quote": "Ik wil jullie club en in het bijzonder ook Benny, en Thomas (en uiteraard ook jou voor de organisatie) van harte bedanken voor de rolstoelinitiaties. De leerkrachten van de scholen waren superblij en gingen in de klassen nog verder rond het thema werken. Ook de jongeren hebben volop genoten van deze initiaties. Dus, een dikke merci!",
    "by": "Kristel - Sportdienst Algemene directie Cultuur, Jeugd en Sport Vlaamse Gemeenschapscommissie"
  },
  {
    "quote": "Jullie bedankt om weeral een fijne initiatie te willen geven aan onze kinderen. Altijd een hele ervaring voor hen.",
    "by": "Anita - Sportpromotor gemeente Aartselaar"
  },
  {
    "quote": "De leerlingen waren echt dolenthousiast wat betreft de sessie rolstoelbasketbal! Het is wat ons betreft zeker voor herhaling vatbaar. Ook de leerkrachten vinden het een echte meerwaarde om de sessies aan te bieden. Leerlingen maken zo kennis met een aspect waarmee ze anders niet geconfronteerd worden. Ze ervaren zelf wat het is om te sporten wanneer je een beperking hebt.",
    "by": "Evi - Heilig Hart Instituut"
  },
  {
    "quote": "De meeste studenten die starten aan de universiteit krijgen dit niet – wat een gemis! Bedankt voor dit totale pakketje van interessante inhouden, de kans onze medestudenten en docenten beter te leren kennen en de avondactiviteiten.",
    "by": "Het GWP team REVAKI - VUB"
  }
]

export function Lbow() {
  const wheelchair = teamsByGroup('wheelchair')

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow="Inclusie"
        title="LBOW & JBOW"
        subtitle="Leuven Bears On Wheels — rolstoelbasketbal van jeugd (JBOW) tot seniors (LBOW), met voorlichting en beleving in scholen."
      />

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Wat we doen
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Evenementen zoals{' '}
            <Link to="/nieuws/fun-on-wheels-2026" className="text-hoop-bright hover:underline">
              Fun on Wheels
            </Link>{' '}
            brengen ploegen samen rond inclusie.
          </p>
        </article>

        <blockquote className="rounded-3xl border border-hoop/35 bg-gradient-to-br from-hoop/15 via-panel to-ink-soft p-6 sm:p-8">
          <p className="font-display text-lg font-bold leading-snug text-cream sm:text-xl">
            “De gaafste gymles ooit! Ik snap nu veel beter hoe het is om een
            handicap te hebben.”
          </p>
          <footer className="mt-4 text-sm text-muted">
            — reactie na een school-voorlichting / belevingssessie
          </footer>
        </blockquote>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Visie
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{visie}</p>
          {visieBullets.length > 0 && (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
              {visieBullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Inclusie
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{inclusie}</p>
        </article>
      </div>

      <article className="mb-10 rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
          Werkwijze
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{werkwijzeIntro}</p>
        {werkwijzeBullets.length > 0 && (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {werkwijzeBullets.map((b) => (
              <li key={b.slice(0, 40)}>{b}</li>
            ))}
          </ul>
        )}
        {werkwijzePractice ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{werkwijzePractice}</p>
        ) : null}
      </article>

      <article className="mb-10 rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
          Fun On Wheels
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{funOnWheels}</p>
      </article>

      <article className="mb-10 rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
          Testimonials
        </p>
        <div className="mt-4 space-y-5">
          {testimonials.map((t) => (
            <figure key={t.by}>
              <blockquote className="text-sm leading-relaxed text-muted">
                “{t.quote.replace(/^[“”"]+|[“”"]+$/g, '')}”
              </blockquote>
              <figcaption className="mt-2 text-xs font-semibold text-cream">
                — {t.by}
              </figcaption>
            </figure>
          ))}
        </div>
      </article>

      <h2 className="mb-4 font-display text-xl font-bold text-cream sm:text-2xl">
        Ploegen
      </h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wheelchair.map((team) => (
          <TeamCard key={team.slug} team={team} />
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-panel/60 p-6 text-center sm:p-8">
        <p className="text-muted">
          Interesse in LBOW/JBOW of een schoolbezoek?
        </p>
        <a
          href={`mailto:${club.contact.email}`}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-hoop px-6 py-3 text-sm font-bold text-white hover:bg-hoop-bright"
        >
          Mail {club.contact.email}
        </a>
      </div>
    </div>
  )
}
