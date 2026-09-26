import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const LOGO_SRC = "/images/ubuntulink-logo.png";

// Used only as a fallback poster if the video cannot load.
const HERO_BG = "/images/ubuntu-sa-network-bg.jpg";

// Hero video
const HERO_VIDEO = "/videos/ubuntulink-hero.mp4";

const PROVIDER_IMAGE = "/images/thabo.jpg";

const languages = [
  { code: "en", name: "English" },
  { code: "zu", name: "isiZulu" },
  { code: "st", name: "Sesotho" },
  { code: "tn", name: "Setswana" },
  { code: "af", name: "Afrikaans" },
];

const cityData = [
  {
    name: "Johannesburg",
    left: "66%",
    top: "43%",
    className: "city-gold",
  },
  {
    name: "Pretoria",
    left: "72%",
    top: "34%",
    className: "city-blue",
  },
  {
    name: "Soweto",
    left: "59%",
    top: "51%",
    className: "city-red",
  },
  {
    name: "Tshwane",
    left: "78%",
    top: "27%",
    className: "city-green",
  },
  {
    name: "Durban",
    left: "84%",
    top: "61%",
    className: "city-green",
  },
  {
    name: "Cape Town",
    left: "30%",
    top: "87%",
    className: "city-blue-red",
  },
  {
    name: "Gqeberha",
    left: "69%",
    top: "81%",
    className: "city-red",
  },
  {
    name: "Bloemfontein",
    left: "54%",
    top: "68%",
    className: "city-gold-blue",
  },
  {
    name: "Polokwane",
    left: "82%",
    top: "18%",
    className: "city-gold",
  },
  {
    name: "Mbombela",
    left: "90%",
    top: "36%",
    className: "city-blue",
  },
];

const services = [
  {
    key: "plumbing",
    image: "/images/services/plumbing.jpg",
  },
  {
    key: "electrical",
    image: "/images/services/electrical.jpg",
  },
  {
    key: "cleaning",
    image: "/images/services/cleaning.jpg",
  },
  {
    key: "painting",
    image: "/images/services/painting.jpg",
  },
  {
    key: "building",
    image: "/images/services/building.jpg",
  },
  {
    key: "hair",
    image: "/images/services/beauty.jpg",
  },
];

const translations = {
  en: {
    nav: {
      home: "Home",
      services: "Services",
      how: "How It Works",
      mzansi: "Built for Mzansi",
      login: "Log In",
      getStarted: "Get Started",
    },

    hero: {
      eyebrow: "LOCAL SERVICES, CONNECTED",
      title: "Find the right person for the job.",
      description:
        "Connect with local service providers for the everyday jobs that keep life moving.",
      findService: "Find a Service",
      becomeProvider: "Become a Provider",
      requestLabel: "Smart request",
      network: "Local provider network",
      placeholder: "What do you need help with?",
      prompts: [
        "I need someone to fix my leaking tap.",
        "I need an electrician to install new lights.",
        "I need someone to clean my home.",
        "I need someone to paint my office.",
        "I need a local hair braider.",
      ],
      note: "Describe the job using text, voice or an image.",
    },

    trust: {
      title: "Local services. Real people. Trusted connections.",
      items: [
        "Verified providers",
        "Local professionals",
        "Secure requests",
        "Flexible scheduling",
      ],
    },

    services: {
      eyebrow: "SERVICES",
      title: "Whatever needs doing, find someone who can.",
      description:
        "Start with some of the most requested local services, with more categories to come.",
      more: "Explore all services",
      items: {
        plumbing: "Plumbing",
        electrical: "Electrical",
        cleaning: "Cleaning",
        painting: "Painting",
        building: "Building & Renovations",
        hair: "Hair & Braiding",
      },
    },

    how: {
      eyebrow: "HOW IT WORKS",
      title: "From problem to provider in four simple steps.",
      steps: [
        {
          number: "01",
          title: "Tell us what you need",
          text: "Choose a service or describe the job in your own words.",
        },
        {
          number: "02",
          title: "Review local matches",
          text: "See providers, service details and availability in one place.",
        },
        {
          number: "03",
          title: "Compare and choose",
          text: "Review profiles, ratings and responses before booking.",
        },
        {
          number: "04",
          title: "Get the job done",
          text: "Book the service and keep your details together from start to finish.",
        },
      ],
    },

    mzansi: {
      eyebrow: "BUILT FOR MZANSI",
      title: "Local first. Accessible everywhere.",
      description:
        "UbuntuLink is designed around the way people find and offer services across South Africa.",
      features: [
        {
          title: "Made for local communities",
          text: "Find skills in the places where you live, work and move between.",
        },
        {
          title: "Multiple languages",
          text: "Use UbuntuLink in English, isiZulu, Sesotho, Setswana or Afrikaans, with more languages planned for the future.",
        },
        {
          title: "Accessibility built in",
          text: "Voice, text and image-based interactions help different users take part.",
        },
      ],
      wideTitle: "Connecting local demand with local skills.",
      wideText:
        "The platform brings customers and service providers together through a local network.",
      citiesTitle: "Growing across South Africa",
    },

    provider: {
      eyebrow: "FOR SERVICE PROVIDERS",
      title: "Turn your skills into opportunity.",
      description:
        "Create a professional profile, show when you are available and connect with customers who need your service.",
      benefits: [
        "Build a professional service profile",
        "Show your skills, location and availability",
        "Receive relevant customer requests",
        "Grow your work through local connections",
      ],
      button: "Become a Provider",
      role: "Plumbing specialist",
      location: "Johannesburg",
      available: "Available today",
      rating: "Rating",
      jobs: "Jobs",
      response: "Response",
    },

    accessibility: {
      eyebrow: "ACCESSIBILITY",
      title: "Designed so more people can take part.",
      description:
        "Simple interactions and multiple ways to communicate make the marketplace easier to use.",
      cards: [
        "Voice input",
        "Text input",
        "Image support",
        "Text-to-speech",
        "Language options",
      ],
    },

    final: {
      eyebrow: "READY WHEN YOU ARE",
      title: "Find local skills. Get the job moving.",
      description:
        "Create your account and start connecting with service providers around you.",
      find: "Find a Service",
      provider: "Become a Provider",
    },

    footer: {
      customer: "For Customers",
      provider: "For Providers",
      company: "Company",
      login: "Log In",
      account: "Create Account",
      services: "Services",
      how: "How It Works",
      becomeProvider: "Become a Provider",
      about: "About UbuntuLink",
      contact: "Contact",
      description:
        "A local service marketplace connecting people with the skills they need.",
    },
  },

  zu: {
    nav: {
      home: "Ikhaya",
      services: "Izinsizakalo",
      how: "Indlela Esebenza Ngayo",
      mzansi: "Yakhelwe iMzansi",
      login: "Ngena",
      getStarted: "Qalisa",
    },

    hero: {
      eyebrow: "IZINSIZAKALO ZASEKHAYA, EZIXHUNYIWE",
      title: "Thola umuntu ofanele umsebenzi.",
      description:
        "Xhumana nabahlinzeki bezinsizakalo bendawo ngemisebenzi yansuku zonke.",
      findService: "Thola Insizakalo",
      becomeProvider: "Yiba Umhlinzeki",
      requestLabel: "Isicelo esihlakaniphile",
      network: "Inethiwekhi yabahlinzeki bendawo",
      placeholder: "Udinga usizo luni?",
      prompts: [
        "Ngidinga umuntu ozolungisa umpompi ovuzayo.",
        "Ngidinga umuntu ozofaka amalambu amasha.",
        "Ngidinga umuntu ozohlanza indlu yami.",
        "Ngidinga umuntu ozopenda ihhovisi lami.",
        "Ngifuna umuntu oluka izinwele eduze nami.",
      ],
      note: "Chaza umsebenzi ngombhalo, ngezwi noma ngesithombe.",
    },

    trust: {
      title:
        "Izinsizakalo zendawo. Abantu bangempela. Ukuxhumana okuthembekile.",
      items: [
        "Abahlinzeki abaqinisekisiwe",
        "Ochwepheshe bendawo",
        "Izicelo ezivikelekile",
        "Ukuhlela okuguquguqukayo",
      ],
    },

    services: {
      eyebrow: "IZINSIZAKALO",
      title: "Noma yini edinga ukwenziwa, thola umuntu ongayenza.",
      description:
        "Qala ngezinye zezinsizakalo ezifunwa kakhulu endaweni, kanti ezinye izigaba zizolandela.",
      more: "Hlola zonke izinsizakalo",
      items: {
        plumbing: "Ukulungisa amapayipi",
        electrical: "Ugesi",
        cleaning: "Ukuhlanza",
        painting: "Ukupenda",
        building: "Ukwakha Nokulungisa",
        hair: "Izinwele Nokuluka",
      },
    },

    how: {
      eyebrow: "INDLELA ESEBENZA NGAYO",
      title: "Kusuka enkingeni uye kumhlinzeki ngezinyathelo ezine.",
      steps: [
        {
          number: "01",
          title: "Sitshele okudingayo",
          text: "Khetha insizakalo noma uchaze umsebenzi ngamazwi akho.",
        },
        {
          number: "02",
          title: "Bheka abahlinzeki bendawo",
          text: "Bona abahlinzeki, imininingwane yensizakalo nokutholakala.",
        },
        {
          number: "03",
          title: "Qhathanisa bese ukhetha",
          text: "Buyekeza amaphrofayili nezilinganiso ngaphambi kokubhuka.",
        },
        {
          number: "04",
          title: "Yenza umsebenzi",
          text: "Bhuka insizakalo bese ugcina imininingwane ndawonye.",
        },
      ],
    },

    mzansi: {
      eyebrow: "YAKHELWE I-MZANSI",
      title: "Indawo kuqala. Ifinyeleleka yonke indawo.",
      description:
        "UbuntuLink yakhelwe ngendlela abantu abazithola nabazinikeza ngayo izinsizakalo eNingizimu Afrika.",
      features: [
        {
          title: "Yenzelwe imiphakathi yendawo",
          text: "Thola amakhono ezindaweni ohlala, osebenza futhi uhamba kuzo.",
        },
        {
          title: "Izinketho zolimi",
          text: "Sebenzisa UbuntuLink ngesiNgisi, isiZulu, Sesotho, Setswana noma Afrikaans, kanti ezinye izilimi zizongezwa esikhathini esizayo.",
        },
        {
          title: "Ukufinyeleleka kwakhelwe ngaphakathi",
          text: "Izwi, umbhalo nezithombe kusiza abasebenzisi abahlukene.",
        },
      ],
      wideTitle: "Ukuxhumanisa izidingo namakhono endawo.",
      wideText:
        "Ipulatifomu ixhumanisa amakhasimende nabahlinzeki ngenethiwekhi yendawo.",
      citiesTitle: "Iyanda eNingizimu Afrika",
    },

    provider: {
      eyebrow: "ABAHLINZEKI BEZINSIZAKALO",
      title: "Guqula amakhono akho abe yithuba.",
      description:
        "Dala iphrofayili yobungcweti, khombisa ukuthi utholakala nini futhi uxhumane namakhasimende.",
      benefits: [
        "Yakha iphrofayili yobungcweti",
        "Khombisa amakhono, indawo nokutholakala kwakho",
        "Thola izicelo zamakhasimende",
        "Khulisa umsebenzi wakho ngokuxhumana kwendawo",
      ],
      button: "Yiba Umhlinzeki",
      role: "Uchwepheshe wamapayipi",
      location: "Johannesburg",
      available: "Uyatholakala namuhla",
      rating: "Isilinganiso",
      jobs: "Imisebenzi",
      response: "Impendulo",
    },

    accessibility: {
      eyebrow: "UKUFINYELELEKA",
      title:
        "Yakhelwe ukuthi abantu abaningi bakwazi ukubamba iqhaza.",
      description:
        "Izindlela ezilula zokuxhumana nezinketho eziningi zenza imakethe ibe lula ukuyisebenzisa.",
      cards: [
        "Okokufaka ngezwi",
        "Okokufaka ngombhalo",
        "Ukusekelwa kwezithombe",
        "Umbhalo ube yizwi",
        "Izinketho zolimi",
      ],
    },

    final: {
      eyebrow: "USULUNGILE?",
      title: "Thola amakhono endawo. Qala umsebenzi.",
      description:
        "Dala i-akhawunti yakho bese uqala ukuxhumana nabahlinzeki abaseduze nawe.",
      find: "Thola Insizakalo",
      provider: "Yiba Umhlinzeki",
    },

    footer: {
      customer: "Amakhasimende",
      provider: "Abahlinzeki",
      company: "Inkampani",
      login: "Ngena",
      account: "Dala I-akhawunti",
      services: "Izinsizakalo",
      how: "Indlela Esebenza Ngayo",
      becomeProvider: "Yiba Umhlinzeki",
      about: "Mayelana neUbuntuLink",
      contact: "Xhumana Nathi",
      description:
        "Imakethe yezinsizakalo zendawo exhumanisa abantu namakhono abawadingayo.",
    },
  },

  st: {
    nav: {
      home: "Lehae",
      services: "Litšebeletso",
      how: "E Sebetsa Joang",
      mzansi: "E Hahiloe bakeng sa Mzansi",
      login: "Kena",
      getStarted: "Qala",
    },

    hero: {
      eyebrow: "LITŠEBELETSO TSA LEHAE, TSE HOKAHANENG",
      title: "Fumana motho ea nepahetseng bakeng sa mosebetsi.",
      description:
        "Ikopanye le bafani ba litšebeletso ba haufi bakeng sa mesebetsi ea letsatsi le letsatsi.",
      findService: "Fumana Tšebeletso",
      becomeProvider: "E-ba Mofani",
      requestLabel: "Kopo e bohlale",
      network: "Marang-rang a bafani ba lehae",
      placeholder: "U hloka thuso ka eng?",
      prompts: [
        "Ke hloka motho ea lokisang pompo e lutlang.",
        "Ke hloka ramotlakase ea ka kenyang mabone a macha.",
        "Ke hloka motho ea hloekisang ntlo ea ka.",
        "Ke hloka motho ea pentang ofisi ea ka.",
        "Ke batla motho ea lohang moriri haufi le nna.",
      ],
      note: "Hlalosa mosebetsi ka mongolo, lentsoe kapa setšoantšo.",
    },

    trust: {
      title:
        "Litšebeletso tsa lehae. Batho ba sebele. Likamano tse tšepahalang.",
      items: [
        "Bafani ba netefalitsoeng",
        "Litsebi tsa lehae",
        "Likopo tse sireletsehileng",
        "Kemiso e feto-fetohang",
      ],
    },

    services: {
      eyebrow: "LITŠEBELETSO",
      title:
        "Eng kapa eng e lokelang ho etsoa, fumana motho ea ka e etsang.",
      description:
        "Qala ka tse ling tsa litšebeletso tse batloang haholo sebakeng sa heno, ha mekhahlelo e meng e tla latela.",
      more: "Sheba litšebeletso tsohle",
      items: {
        plumbing: "Lipompo le lipeipi",
        electrical: "Motlakase",
        cleaning: "Ho hloekisa",
        painting: "Ho penta",
        building: "Kaho le Ntlafatso",
        hair: "Moriri le ho loha",
      },
    },

    how: {
      eyebrow: "E SEBETSA JOANG",
      title: "Ho tloha bothateng ho ea ho mofani ka mehato e mene.",
      steps: [
        {
          number: "01",
          title: "Re bolelle seo u se hlokang",
          text: "Khetha tšebeletso kapa hlalosa mosebetsi ka mantsoe a hao.",
        },
        {
          number: "02",
          title: "Sheba bafani ba lehae",
          text: "Bona bafani, lintlha tsa tšebeletso le ho fumaneha.",
        },
        {
          number: "03",
          title: "Bapisa ebe u khetha",
          text: "Sheba liprofaele le lintlha pele u etsa peeletso.",
        },
        {
          number: "04",
          title: "Qeta mosebetsi",
          text: "Beheletsa tšebeletso 'me u boloke lintlha sebakeng se le seng.",
        },
      ],
    },

    mzansi: {
      eyebrow: "E HAHILOE BAKENG SA MZANSI",
      title: "Lehae pele. E fumaneha hohle.",
      description:
        "UbuntuLink e etselitsoe tsela eo batho ba fumanang le ho fana ka litšebeletso Afrika Boroa.",
      features: [
        {
          title: "E etselitsoe sechaba sa lehae",
          text: "Fumana litsebo libakeng tseo u lulang, u sebetsang le ho tsamaea ho tsona.",
        },
        {
          title: "Likhetho tsa lipuo",
          text: "Sebelisa UbuntuLink ka Senyesemane, isiZulu, Sesotho, Setswana kapa Afrikaans, 'me lipuo tse ling li tla eketsoa nakong e tlang.",
        },
        {
          title: "Phihlello e hahiloeng ka hare",
          text: "Lentsoe, mongolo le litšoantšo li thusa basebelisi ba fapaneng.",
        },
      ],
      wideTitle: "Ho hokahanya tlhoko le bokhoni ba lehae.",
      wideText:
        "Sistimi e hokahanya bareki le bafani ka marang-rang a lehae.",
      citiesTitle: "E hola ho pholletsa le Afrika Boroa",
    },

    provider: {
      eyebrow: "BAFANI BA LITŠEBELETSO",
      title: "Fetola litsebo tsa hau hore e be monyetla.",
      description:
        "Theha profaele ea litsebi, bontša ho fumaneha ha hao 'me u hokahane le bareki.",
      benefits: [
        "Theha profaele ea tšebeletso ea botsebi",
        "Bontša litsebo, sebaka le ho fumaneha ha hao",
        "Amohela likopo tsa bareki",
        "Holisa mosebetsi oa hau ka likamano tsa lehae",
      ],
      button: "E-ba Mofani",
      role: "Setsebi sa lipompo",
      location: "Johannesburg",
      available: "O teng kajeno",
      rating: "Tekanyetso",
      jobs: "Mesebetsi",
      response: "Karabelo",
    },

    accessibility: {
      eyebrow: "PHIHLELLO",
      title: "E etselitsoe hore batho ba bangata ba nke karolo.",
      description:
        "Litšebelisano tse bonolo le mekhoa e fapaneng ea puisano li etsa hore 'maraka o be bonolo.",
      cards: [
        "Ho kenya ka lentsoe",
        "Ho kenya ka mongolo",
        "Tšehetso ea litšoantšo",
        "Mongolo ho ea lentsoeng",
        "Likhetho tsa puo",
      ],
    },

    final: {
      eyebrow: "U SE U LOKILE?",
      title: "Fumana litsebo tsa lehae. Qala mosebetsi.",
      description:
        "Theha ak'haonte ea hau 'me u qale ho hokahana le bafani ba litšebeletso haufi le uena.",
      find: "Fumana Tšebeletso",
      provider: "E-ba Mofani",
    },

    footer: {
      customer: "Bakeng sa Bareki",
      provider: "Bakeng sa Bafani",
      company: "Khampani",
      login: "Kena",
      account: "Theha Ak'haonte",
      services: "Litšebeletso",
      how: "E Sebetsa Joang",
      becomeProvider: "E-ba Mofani",
      about: "Mabapi le UbuntuLink",
      contact: "Ikopanye le Rona",
      description:
        "Mmaraka oa litšebeletso tsa lehae o hokahanyang batho le litsebo tseo ba li hlokang.",
    },
  },

  tn: {
    nav: {
      home: "Gae",
      services: "Ditirelo",
      how: "E Dira Jang",
      mzansi: "E Agilwe bakeng sa Mzansi",
      login: "Tsena",
      getStarted: "Simolola",
    },

    hero: {
      eyebrow: "DITIRELO TSA LEGAE, TSE DI GOLAGANYENG",
      title: "Fumana motho yo o siameng mo tirong.",
      description:
        "Golagana le bafani ba ditirelo ba mo lefelong la gago ka ditiro tsa letsatsi le letsatsi.",
      findService: "Batla Tirelo",
      becomeProvider: "Nna Mofani",
      requestLabel: "Kopo e e botlhale",
      network: "Netweke ya bafani ba ditirelo ba mo lefelong",
      placeholder: "O tlhoka thuso ka eng?",
      prompts: [
        "Ke tlhoka mongwe yo o ka baakanyang pompo e e dutlang.",
        "Ke tlhoka motlakase yo o ka tsenyang mabone a mantšhwa.",
        "Ke tlhoka mongwe yo o ka phepafatsang ntlo ya me.",
        "Ke tlhoka mongwe yo o ka pentang ofisi ya me.",
        "Ke batla mongwe wa go loga moriri gaufi le nna.",
      ],
      note: "Tlhalosa tiro ka mokwalo, lentswe kgotsa setshwantsho.",
    },

    trust: {
      title:
        "Ditirelo tsa mo lefelong. Batho ba mmatota. Dikgolagano tse di ikanyegang.",
      items: [
        "Bafani ba ba netefaditsweng",
        "Baitseanape ba mo lefelong",
        "Dikopo tse di sireletsegileng",
        "Thulaganyo e e fetofetogang",
      ],
    },

    services: {
      eyebrow: "DITIRELO",
      title:
        "Eng kapa eng e e tlhokang go dirwa, bona mongwe yo o ka e dirang.",
      description:
        "Simolola ka dingwe tsa ditirelo tse di batliwang thata mo lefelong, mme dikarolo tse dingwe di tla latela.",
      more: "Bona ditirelo tsotlhe",
      items: {
        plumbing: "Diphaephe le dipompo",
        electrical: "Motlakase",
        cleaning: "Go phepafatsa",
        painting: "Go penta",
        building: "Kago le go baakanya",
        hair: "Moriri le go loga",
      },
    },

    how: {
      eyebrow: "E DIRA JANG",
      title: "Go tswa mo bothateng go ya kwa mofaning ka dikgato tse nne.",
      steps: [
        {
          number: "01",
          title: "Re bolelele se o se tlhokang",
          text: "Tlhopha tirelo kgotsa tlhalosa tiro ka mafoko a gago.",
        },
        {
          number: "02",
          title: "Bona bafani ba mo lefelong",
          text: "Bona bafani, dintlha tsa tirelo le nako e ba leng teng.",
        },
        {
          number: "03",
          title: "Bapisa mme o tlhophe",
          text: "Leba diprofaele le ditekanyetso pele ga go beeletsa.",
        },
        {
          number: "04",
          title: "Dira tiro",
          text: "Beeletsa tirelo mme o boloke dintlha tsotlhe mmogo.",
        },
      ],
    },

    mzansi: {
      eyebrow: "E AGILWE BAKENG SA MZANSI",
      title: "Mo lefelong pele. E fitlhelega gongwe le gongwe.",
      description:
        "UbuntuLink e dirilwe go tsamaisana le tsela e batho ba bonang le go aba ditirelo ka yone mo Aforika Borwa.",
      features: [
        {
          title: "E diretswe ditšhaba tsa mo lefelong",
          text: "Fumana bokgoni mo mafelong a o nnang, o berekang le go tsamaya mo go one.",
        },
        {
          title: "Dikgetho tsa dipuo",
          text: "Dirisa UbuntuLink ka English, isiZulu, Sesotho, Setswana kgotsa Afrikaans, mme dipuo tse dingwe di tla okediwa mo isagong.",
        },
        {
          title: "Phitlhelelo e agilwe mo teng",
          text: "Lentswe, mokwalo le ditshwantsho di thusa badirisi ba ba farologaneng.",
        },
      ],
      wideTitle: "Go golaganya tlhokego le bokgoni jwa mo lefelong.",
      wideText:
        "Sisteme e golaganya bareki le bafani ka netweke ya mo lefelong.",
      citiesTitle: "E gola mo Aforika Borwa",
    },

    provider: {
      eyebrow: "BAFANI BA DITIRELO",
      title: "Fetola bokgoni jwa gago go nna tshono.",
      description:
        "Dira profaele ya seporofešenale, bontsha nako e o leng teng mme o golagane le bareki.",
      benefits: [
        "Dira profaele ya seporofešenale",
        "Bontsha bokgoni, lefelo le nako e o leng teng",
        "Amogela dikopo tsa bareki",
        "Godisa tiro ya gago ka dikgolagano tsa mo lefelong",
      ],
      button: "Nna Mofani",
      role: "Moitseanape wa diphaephe",
      location: "Johannesburg",
      available: "O teng gompieno",
      rating: "Tekanyetso",
      jobs: "Ditiro",
      response: "Karabo",
    },

    accessibility: {
      eyebrow: "PHITLHELELO",
      title:
        "E agilwe gore batho ba bantsi ba kgone go tsaya karolo.",
      description:
        "Ditsela tse di bonolo tsa go dirisana le mekgwa e e farologaneng ya puisano di dira gore mmaraka o nne bonolo.",
      cards: [
        "Keno ya lentswe",
        "Keno ya mokwalo",
        "Tshegetso ya ditshwantsho",
        "Mokwadi go nna lentswe",
        "Dikgetho tsa puo",
      ],
    },

    final: {
      eyebrow: "O SIAME?",
      title: "Fumana bokgoni jwa mo lefelong. Tsamaisa tiro.",
      description:
        "Dira akhaonto ya gago mme o simolole go golagana le bafani ba ditirelo ba ba go dikologileng.",
      find: "Batla Tirelo",
      provider: "Nna Mofani",
    },

    footer: {
      customer: "Bakeng sa Bareki",
      provider: "Bakeng sa Bafani",
      company: "Khampani",
      login: "Tsena",
      account: "Dira Akhaonto",
      services: "Ditirelo",
      how: "E Dira Jang",
      becomeProvider: "Nna Mofani",
      about: "Ka UbuntuLink",
      contact: "Ikgolaganye le Rona",
      description:
        "Mmaraka wa ditirelo tsa mo lefelong o o golaganyang batho le bokgoni jo ba bo tlhokang.",
    },
  },

  af: {
    nav: {
      home: "Tuis",
      services: "Dienste",
      how: "Hoe Dit Werk",
      mzansi: "Gebou vir Mzansi",
      login: "Meld Aan",
      getStarted: "Begin",
    },

    hero: {
      eyebrow: "PLAASLIKE DIENSTE, VERBIND",
      title: "Vind die regte persoon vir die werk.",
      description:
        "Skakel met plaaslike diensverskaffers vir die alledaagse take wat die lewe aan die gang hou.",
      findService: "Vind 'n Diens",
      becomeProvider: "Word 'n Diensverskaffer",
      requestLabel: "Slim versoek",
      network: "Plaaslike diensverskaffernetwerk",
      placeholder: "Waarmee het jy hulp nodig?",
      prompts: [
        "Ek het iemand nodig om my lekkende kraan reg te maak.",
        "Ek het 'n elektrisiën nodig om nuwe ligte te installeer.",
        "Ek het iemand nodig om my huis skoon te maak.",
        "Ek het iemand nodig om my kantoor te verf.",
        "Ek soek 'n haarvlegter naby my.",
      ],
      note: "Beskryf die werk met teks, stem of 'n beeld.",
    },

    trust: {
      title: "Plaaslike dienste. Regte mense. Betroubare verbindings.",
      items: [
        "Geverifieerde verskaffers",
        "Plaaslike professionele persone",
        "Veilige versoeke",
        "Buigsame skedulering",
      ],
    },

    services: {
      eyebrow: "DIENSTE",
      title:
        "Wat ook al gedoen moet word, vind iemand wat dit kan doen.",
      description:
        "Begin met sommige van die mees gevraagde plaaslike dienste, met meer kategorieë wat later volg.",
      more: "Verken alle dienste",
      items: {
        plumbing: "Loodgietery",
        electrical: "Elektries",
        cleaning: "Skoonmaak",
        painting: "Verfwerk",
        building: "Bouwerk & Opknappings",
        hair: "Hare & Vlegsels",
      },
    },

    how: {
      eyebrow: "HOE DIT WERK",
      title:
        "Van probleem tot diensverskaffer in vier eenvoudige stappe.",
      steps: [
        {
          number: "01",
          title: "Vertel ons wat jy nodig het",
          text: "Kies 'n diens of beskryf die werk in jou eie woorde.",
        },
        {
          number: "02",
          title: "Hersien plaaslike passings",
          text: "Sien verskaffers, diensbesonderhede en beskikbaarheid.",
        },
        {
          number: "03",
          title: "Vergelyk en kies",
          text: "Hersien profiele en graderings voordat jy bespreek.",
        },
        {
          number: "04",
          title: "Kry die werk gedoen",
          text: "Bespreek die diens en hou alles bymekaar van begin tot einde.",
        },
      ],
    },

    mzansi: {
      eyebrow: "GEBOU VIR MZANSI",
      title: "Plaaslik eerste. Toeganklik oral.",
      description:
        "UbuntuLink is ontwerp rondom hoe mense werklik dienste in Suid-Afrika vind en aanbied.",
      features: [
        {
          title: "Gemaak vir plaaslike gemeenskappe",
          text: "Vind vaardighede in die plekke waar jy woon, werk en beweeg.",
        },
        {
          title: "Taalopsies",
          text: "Gebruik UbuntuLink in Engels, isiZulu, Sesotho, Setswana of Afrikaans, met meer tale wat in die toekoms beplan word.",
        },
        {
          title: "Toeganklikheid ingebou",
          text: "Stem, teks en beelde help verskillende gebruikers om deel te neem.",
        },
      ],
      wideTitle: "Verbind plaaslike vraag met plaaslike vaardighede.",
      wideText:
        "Die platform verbind klante en diensverskaffers deur 'n plaaslike netwerk.",
      citiesTitle: "Groei regoor Suid-Afrika",
    },

    provider: {
      eyebrow: "VIR DIENSVERSKAFFERS",
      title: "Verander jou vaardighede in geleenthede.",
      description:
        "Skep 'n professionele profiel, wys wanneer jy beskikbaar is en verbind met klante wat jou diens benodig.",
      benefits: [
        "Bou 'n professionele diensprofiel",
        "Wys jou vaardighede, ligging en beskikbaarheid",
        "Ontvang relevante klantversoeke",
        "Groei jou werk deur plaaslike verbindings",
      ],
      button: "Word 'n Diensverskaffer",
      role: "Loodgietery-spesialis",
      location: "Johannesburg",
      available: "Vandag beskikbaar",
      rating: "Gradering",
      jobs: "Take",
      response: "Reaksie",
    },

    accessibility: {
      eyebrow: "TOEGANKLIKHEID",
      title: "Ontwerp sodat meer mense kan deelneem.",
      description:
        "Eenvoudige interaksies en verskeie maniere om te kommunikeer maak die mark makliker om te gebruik.",
      cards: [
        "Stem-invoer",
        "Teksinvoer",
        "Beeldondersteuning",
        "Teks-na-spraak",
        "Taalopsies",
      ],
    },

    final: {
      eyebrow: "GEREED WANNEER JY IS",
      title:
        "Vind plaaslike vaardighede. Kry die werk aan die gang.",
      description:
        "Skep jou rekening en begin met diensverskaffers naby jou skakel.",
      find: "Vind 'n Diens",
      provider: "Word 'n Diensverskaffer",
    },

    footer: {
      customer: "Vir Klante",
      provider: "Vir Verskaffers",
      company: "Maatskappy",
      login: "Meld Aan",
      account: "Skep Rekening",
      services: "Dienste",
      how: "Hoe Dit Werk",
      becomeProvider: "Word 'n Diensverskaffer",
      about: "Oor UbuntuLink",
      contact: "Kontak",
      description:
        "'n Plaaslike diensmark wat mense met die vaardighede wat hulle nodig het verbind.",
    },
  },
};

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m7 9 5 5 5-5" />
      </svg>
    );
  }

  if (name === "globe") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5S14.2 18.2 12 20.5C9.8 18.2 8.7 15.4 8.7 12S9.8 5.8 12 3.5Z" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="5.8" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 20 6v5c0 5.1-3.2 8.7-8 10-4.8-1.3-8-4.9-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "voice") {
    return (
      <svg {...common}>
        <rect x="9" y="3.5" width="6" height="11" rx="3" />
        <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
        <path d="M12 17v3.5" />
        <path d="M9 20.5h6" />
      </svg>
    );
  }

  if (name === "image") {
    return (
      <svg {...common}>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <circle cx="9" cy="9" r="1.5" />
        <path d="m5.5 17 4.5-4.5 3 3 2-2 3.5 3.5" />
      </svg>
    );
  }

  if (name === "text") {
    return (
      <svg {...common}>
        <path d="M5 6h14" />
        <path d="M12 6v12" />
        <path d="M8.5 18h7" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10.5c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10.5" r="2.5" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <circle cx="9" cy="9" r="3" />
        <path d="M3.5 19c.5-3 2.5-4.5 5.5-4.5s5 1.5 5.5 4.5" />
        <path d="M16 6.5a2.5 2.5 0 0 1 0 5" />
        <path d="M17 14.5c2.1.3 3.3 1.6 3.5 3.5" />
      </svg>
    );
  }

  return null;
}

export default function Welcome() {
  const [language, setLanguage] = useState("en");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const heroVideoRef = useRef(null);

  const t = translations[language];

  const currentPrompt =
    t.hero.prompts[promptIndex % t.hero.prompts.length];

  useEffect(() => {
    document.documentElement.lang =
      language === "en"
        ? "en-ZA"
        : language === "zu"
          ? "zu-ZA"
          : language === "st"
            ? "st-ZA"
            : language === "tn"
              ? "tn-ZA"
              : "af-ZA";
  }, [language]);

  useEffect(() => {
    setPromptIndex(0);
  }, [language]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((current) => current + 1);
    }, 4500);

    return () => clearInterval(interval);
  }, [language]);

  // Respect users who prefer reduced motion.
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const handleMotionPreference = () => {
      if (!heroVideoRef.current) {
        return;
      }

      if (mediaQuery.matches) {
        heroVideoRef.current.pause();
        heroVideoRef.current.currentTime = 0;
      } else {
        heroVideoRef.current
          .play()
          .catch(() => {
            // Browser may block autoplay. The poster remains visible.
          });
      }
    };

    handleMotionPreference();

    mediaQuery.addEventListener(
      "change",
      handleMotionPreference
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleMotionPreference
      );
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="shell">
          <nav className="site-nav">
            <Link to="/" className="brand-mark">
              <span className="brand-symbol">
                <img
                  src={LOGO_SRC}
                  alt="UbuntuLink logo"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </span>

              <span className="brand-word">
                UbuntuLink
              </span>
            </Link>

            <div className="desktop-nav">
              <button
                type="button"
                onClick={() => scrollToSection("home")}
              >
                {t.nav.home}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("services")}
              >
                {t.nav.services}
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection("how-it-works")
                }
              >
                {t.nav.how}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("mzansi")}
              >
                {t.nav.mzansi}
              </button>
            </div>

            <div className="nav-actions">
              <div className="language-selector">
                <button
                  type="button"
                  className="language-trigger"
                  onClick={() =>
                    setLanguageOpen(!languageOpen)
                  }
                  aria-expanded={languageOpen}
                >
                  <Icon name="globe" size={15} />

                  <span>
                    {
                      languages.find(
                        (item) => item.code === language
                      )?.name
                    }
                  </span>

                  <Icon name="chevron" size={13} />
                </button>

                {languageOpen && (
                  <div className="language-menu">
                    {languages.map((item) => (
                      <button
                        type="button"
                        key={item.code}
                        className={`language-option ${
                          item.code === language
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() => {
                          setLanguage(item.code);
                          setLanguageOpen(false);
                        }}
                      >
                        <span>{item.name}</span>

                        {item.code === language && (
                          <Icon name="check" size={14} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/login"
                className="nav-login"
              >
                {t.nav.login}
              </Link>

              <Link
                to="/register"
                className="button button-primary nav-cta"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* ================================
            HERO
        ================================= */}
        <section
          id="home"
          className="hero-section"
        >
          <div
            className="hero-map-layer"
            aria-hidden="true"
          >
            <video
              ref={heroVideoRef}
              className="hero-map-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={HERO_BG}
              tabIndex={-1}
            >
              <source
                src={HERO_VIDEO}
                type="video/mp4"
              />
            </video>

            <div className="hero-map-overlay" />
          </div>

          <div className="shell hero-content">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {t.hero.eyebrow}
              </div>

              <h1>{t.hero.title}</h1>

              <p className="hero-description">
                {t.hero.description}
              </p>

              <div className="hero-actions">
                <Link
                  to="/register"
                  className="button button-primary"
                >
                  {t.hero.findService}
                  <Icon name="arrow" size={17} />
                </Link>

                <Link
                  to="/register"
                  className="button button-outline-light"
                >
                  {t.hero.becomeProvider}
                </Link>
              </div>

              <div className="request-card">
                <div className="request-card-top">
                  <span className="request-label">
                    <span className="request-pulse" />
                    {t.hero.requestLabel}
                  </span>

                  <span className="request-network">
                    {t.hero.network}
                  </span>
                </div>

                <div className="request-input">
                  <div className="request-icon">
                    <Icon name="search" size={20} />
                  </div>

                  <div className="request-copy">
                    <span className="request-placeholder">
                      {t.hero.placeholder}
                    </span>

                    <span
                      key={currentPrompt}
                      className="request-example"
                    >
                      {currentPrompt}
                    </span>
                  </div>

                  <span className="request-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </div>

                <div className="request-note">
                  <Icon name="text" size={14} />
                  <span>{t.hero.note}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-bottom-line" />
        </section>

        {/* ================================
            TRUST
        ================================= */}
        <section className="trust-strip">
          <div className="shell trust-grid">
            <div className="trust-title">
              {t.trust.title}
            </div>

            <div className="trust-item">
              <span className="trust-icon trust-green">
                <Icon name="shield" size={16} />
              </span>
              {t.trust.items[0]}
            </div>

            <div className="trust-item">
              <span className="trust-icon trust-blue">
                <Icon name="users" size={16} />
              </span>
              {t.trust.items[1]}
            </div>

            <div className="trust-item">
              <span className="trust-icon trust-gold">
                <Icon name="check" size={16} />
              </span>
              {t.trust.items[2]}
            </div>

            <div className="trust-item">
              <span className="trust-icon trust-red">
                <Icon name="clock" size={16} />
              </span>
              {t.trust.items[3]}
            </div>
          </div>
        </section>

        {/* ================================
            SERVICES
        ================================= */}
        <section
          id="services"
          className="light-section section-space"
        >
          <div className="shell">
            <div className="split-heading">
              <div className="section-heading">
                <div className="section-eyebrow">
                  {t.services.eyebrow}
                </div>

                <h2>{t.services.title}</h2>

                <p>
                  {t.services.description}
                </p>
              </div>
            </div>

            <div className="services-grid">
              {services.map((service) => (
                <article
                  className="service-card"
                  key={service.key}
                >
                  <div className="service-image">
                    <img
                      src={service.image}
                      alt={
                        t.services.items[service.key]
                      }
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>

                  <div className="service-card-content">
                    <span>
                      {t.services.items[service.key]}
                    </span>

                    <span className="service-arrow">
                      <Icon name="arrow" size={16} />
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="center-link">
              <Link
                to="/register"
                className="text-link"
              >
                {t.services.more}
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* ================================
            HOW IT WORKS
        ================================= */}
        <section
          id="how-it-works"
          className="how-section section-space"
        >
          <div className="shell">
            <div className="section-heading centered-heading">
              <div className="section-eyebrow">
                {t.how.eyebrow}
              </div>

              <h2>{t.how.title}</h2>
            </div>

            <div className="steps-grid">
              {t.how.steps.map((step) => (
                <article
                  className="step-card"
                  key={step.number}
                >
                  <span className="step-number">
                    {step.number}
                  </span>

                  <div className="step-icon">
                    <Icon
                      name={
                        step.number === "01"
                          ? "search"
                          : step.number === "02"
                            ? "users"
                            : step.number === "03"
                              ? "check"
                              : "arrow"
                      }
                      size={19}
                    />
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================================
            MZANSI
        ================================= */}
        <section
          id="mzansi"
          className="mzansi-section section-space"
        >
          <div className="mzansi-network">
            <div className="mzansi-grid-lines" />

            <div className="mzansi-glow mzansi-glow-one" />

            <div className="mzansi-glow mzansi-glow-two" />
          </div>

          <div className="shell mzansi-shell">
            <div className="mzansi-heading">
              <div className="section-eyebrow">
                {t.mzansi.eyebrow}
              </div>

              <h2>{t.mzansi.title}</h2>

              <p>{t.mzansi.description}</p>

              <div className="flag-accent" />
            </div>

            <div className="mzansi-grid">
              {t.mzansi.features.map(
                (feature, index) => (
                  <article
                    className="mzansi-card mzansi-feature-card"
                    key={feature.title}
                  >
                    <div
                      className={`mzansi-card-icon ${
                        index === 0
                          ? "icon-green"
                          : index === 1
                            ? "icon-blue"
                            : "icon-gold"
                      }`}
                    >
                      <Icon
                        name={
                          index === 0
                            ? "location"
                            : index === 1
                              ? "globe"
                              : "shield"
                        }
                        size={20}
                      />
                    </div>

                    <h3>{feature.title}</h3>

                    <p>{feature.text}</p>
                  </article>
                )
              )}

              <article className="mzansi-card mzansi-wide-card">
                <div className="wide-card-copy">
                  <div className="mzansi-card-icon icon-green">
                    <Icon name="users" size={20} />
                  </div>

                  <h3>
                    {t.mzansi.wideTitle}
                  </h3>

                  <p>
                    {t.mzansi.wideText}
                  </p>
                </div>

                <div className="mini-network">
                  <span className="network-node node-one" />
                  <span className="network-node node-two" />
                  <span className="network-node node-three" />
                  <span className="network-node node-four" />

                  <span className="network-line line-one" />
                  <span className="network-line line-two" />
                  <span className="network-line line-three" />
                </div>
              </article>

              <article className="mzansi-card mzansi-cities-card">
                <div className="mzansi-card-icon icon-blue">
                  <Icon name="location" size={20} />
                </div>

                <h3>{t.mzansi.citiesTitle}</h3>

                <div className="city-chip-grid">
                  {cityData.map(
                    (city, index) => (
                      <span
                        className={`city-chip ${
                          index % 4 === 0
                            ? "green"
                            : index % 4 === 1
                              ? "blue"
                              : index % 4 === 2
                                ? "gold"
                                : "red"
                        }`}
                        key={city.name}
                      >
                        {city.name}
                      </span>
                    )
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ================================
            PROVIDER
        ================================= */}
        <section className="provider-section section-space">
          <div className="shell provider-layout">
            <div className="provider-copy">
              <div className="section-eyebrow">
                {t.provider.eyebrow}
              </div>

              <h2>{t.provider.title}</h2>

              <p>{t.provider.description}</p>

              <div className="provider-benefits">
                {t.provider.benefits.map(
                  (benefit) => (
                    <div
                      className="benefit-item"
                      key={benefit}
                    >
                      <span className="benefit-check">
                        <Icon
                          name="check"
                          size={15}
                        />
                      </span>

                      {benefit}
                    </div>
                  )
                )}
              </div>

              <Link
                to="/register"
                className="button button-primary"
              >
                {t.provider.button}
                <Icon name="arrow" size={17} />
              </Link>
            </div>

            <div className="provider-visual">
              <div className="provider-illustration">
                <div className="provider-circle circle-one" />
                <div className="provider-circle circle-two" />

                <div className="provider-profile">
                  <div className="provider-profile-top">
                    <div className="provider-avatar">
                      <img
                        src={PROVIDER_IMAGE}
                        alt="Service provider"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      <span>TM</span>
                    </div>

                    <div>
                      <strong>Thabo M.</strong>

                      <span>
                        {t.provider.role}
                      </span>
                    </div>
                  </div>

                  <div className="provider-profile-location">
                    <Icon
                      name="location"
                      size={14}
                    />
                    {t.provider.location}
                  </div>

                  <div className="provider-profile-divider" />

                  <div className="provider-profile-stats">
                    <div>
                      <span>
                        {t.provider.rating}
                      </span>

                      <strong>4.9</strong>
                    </div>

                    <div>
                      <span>
                        {t.provider.jobs}
                      </span>

                      <strong>126</strong>
                    </div>

                    <div>
                      <span>
                        {t.provider.response}
                      </span>

                      <strong>15m</strong>
                    </div>
                  </div>

                  <div className="provider-available">
                    <span>
                      <span className="online-dot" />
                      {t.provider.available}
                    </span>

                    <Icon
                      name="check"
                      size={13}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================
            ACCESSIBILITY
        ================================= */}
        <section className="accessibility-section section-space">
          <div className="shell">
            <div className="section-heading centered-heading">
              <div className="section-eyebrow">
                {t.accessibility.eyebrow}
              </div>

              <h2>
                {t.accessibility.title}
              </h2>

              <p>
                {t.accessibility.description}
              </p>
            </div>

            <div className="accessibility-grid">
              {t.accessibility.cards.map(
                (card, index) => (
                  <article
                    className="access-card"
                    key={card}
                  >
                    <span className="access-icon">
                      <Icon
                        name={
                          index === 0
                            ? "voice"
                            : index === 1
                              ? "text"
                              : index === 2
                                ? "image"
                                : index === 3
                                  ? "voice"
                                  : "globe"
                        }
                        size={20}
                      />
                    </span>

                    <span>{card}</span>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* ================================
            FINAL CTA
        ================================= */}
        <section className="final-cta section-space">
          <div className="final-cta-network">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="shell final-cta-inner">
            <div className="final-eyebrow">
              <span className="final-eyebrow-line" />
              {t.final.eyebrow}
              <span className="final-eyebrow-line" />
            </div>

            <h2>{t.final.title}</h2>

            <p>{t.final.description}</p>

            <div className="hero-actions final-actions">
              <Link
                to="/register"
                className="button button-primary"
              >
                {t.final.find}
                <Icon name="arrow" size={17} />
              </Link>

              <Link
                to="/register"
                className="button button-outline-light"
              >
                {t.final.provider}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ================================
          FOOTER
      ================================= */}
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <Link
              to="/"
              className="brand-mark footer-brand-mark"
            >
              <span className="brand-symbol">
                <img
                  src={LOGO_SRC}
                  alt="UbuntuLink logo"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </span>

              <span className="brand-word">
                UbuntuLink
              </span>
            </Link>

            <p>{t.footer.description}</p>

            <div className="flag-accent footer-accent" />
          </div>

          <div>
            <span className="footer-heading">
              {t.footer.customer}
            </span>

            <div className="footer-column">
              <Link to="/login">
                {t.footer.login}
              </Link>

              <Link to="/register">
                {t.footer.account}
              </Link>

              <a href="#services">
                {t.footer.services}
              </a>
            </div>
          </div>

          <div>
            <span className="footer-heading">
              {t.footer.provider}
            </span>

            <div className="footer-column">
              <Link to="/register">
                {t.footer.becomeProvider}
              </Link>

              <a href="#how-it-works">
                {t.footer.how}
              </a>
            </div>
          </div>

          <div>
            <span className="footer-heading">
              {t.footer.company}
            </span>

            <div className="footer-column">
              <a href="#mzansi">
                {t.footer.about}
              </a>

              <a href="mailto:hello@ubuntulink.co.za">
                {t.footer.contact}
              </a>
            </div>
          </div>
        </div>

        <div className="shell footer-bottom">
          <span>
            © {new Date().getFullYear()} UbuntuLink
          </span>

          <div className="footer-mini-nav">
            <a href="#services">
              {t.footer.services}
            </a>

            <a href="#how-it-works">
              {t.footer.how}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}