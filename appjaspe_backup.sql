--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: groupes; Type: TABLE; Schema: public; Owner: zatourexeva
--

CREATE TABLE public.groupes (
    id integer NOT NULL,
    nom character varying(100) NOT NULL
);


ALTER TABLE public.groupes OWNER TO zatourexeva;

--
-- Name: groupes_id_seq; Type: SEQUENCE; Schema: public; Owner: zatourexeva
--

CREATE SEQUENCE public.groupes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groupes_id_seq OWNER TO zatourexeva;

--
-- Name: groupes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zatourexeva
--

ALTER SEQUENCE public.groupes_id_seq OWNED BY public.groupes.id;


--
-- Name: membres; Type: TABLE; Schema: public; Owner: zatourexeva
--

CREATE TABLE public.membres (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    identifiant character varying(50) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    groupe_id integer
);


ALTER TABLE public.membres OWNER TO zatourexeva;

--
-- Name: membres_id_seq; Type: SEQUENCE; Schema: public; Owner: zatourexeva
--

CREATE SEQUENCE public.membres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.membres_id_seq OWNER TO zatourexeva;

--
-- Name: membres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zatourexeva
--

ALTER SEQUENCE public.membres_id_seq OWNED BY public.membres.id;


--
-- Name: presences; Type: TABLE; Schema: public; Owner: zatourexeva
--

CREATE TABLE public.presences (
    id integer NOT NULL,
    membre_id integer,
    date_presence date NOT NULL,
    reunion_id integer
);


ALTER TABLE public.presences OWNER TO zatourexeva;

--
-- Name: presences_id_seq; Type: SEQUENCE; Schema: public; Owner: zatourexeva
--

CREATE SEQUENCE public.presences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.presences_id_seq OWNER TO zatourexeva;

--
-- Name: presences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zatourexeva
--

ALTER SEQUENCE public.presences_id_seq OWNED BY public.presences.id;


--
-- Name: reunions; Type: TABLE; Schema: public; Owner: zatourexeva
--

CREATE TABLE public.reunions (
    id integer NOT NULL,
    libelle character varying(100) NOT NULL
);


ALTER TABLE public.reunions OWNER TO zatourexeva;

--
-- Name: reunions_id_seq; Type: SEQUENCE; Schema: public; Owner: zatourexeva
--

CREATE SEQUENCE public.reunions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reunions_id_seq OWNER TO zatourexeva;

--
-- Name: reunions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zatourexeva
--

ALTER SEQUENCE public.reunions_id_seq OWNED BY public.reunions.id;


--
-- Name: groupes id; Type: DEFAULT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.groupes ALTER COLUMN id SET DEFAULT nextval('public.groupes_id_seq'::regclass);


--
-- Name: membres id; Type: DEFAULT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.membres ALTER COLUMN id SET DEFAULT nextval('public.membres_id_seq'::regclass);


--
-- Name: presences id; Type: DEFAULT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.presences ALTER COLUMN id SET DEFAULT nextval('public.presences_id_seq'::regclass);


--
-- Name: reunions id; Type: DEFAULT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.reunions ALTER COLUMN id SET DEFAULT nextval('public.reunions_id_seq'::regclass);


--
-- Data for Name: groupes; Type: TABLE DATA; Schema: public; Owner: zatourexeva
--

COPY public.groupes (id, nom) FROM stdin;
1	Agate
2	Jaspe
3	Diamant
4	Chrysophase
5	Beryl
6	Topaz
\.


--
-- Data for Name: membres; Type: TABLE DATA; Schema: public; Owner: zatourexeva
--

COPY public.membres (id, nom, identifiant, mot_de_passe, groupe_id) FROM stdin;
56	Gas	gas10	gas123	1
57	Jean-Denis	jeand11	jeand123	1
58	Jean-Claude	jeanC10	jeanc123	1
59	Odilon	odilon11	odilon123	1
60	Lilian	lilian10	lilian123	1
61	Tresor	tresor11	tresor123	1
62	Fabrice	fabrice10	fabrice123	1
63	Omogaby	omogaby11	omogaby123	1
64	Edwin	edwin11	edwin123	1
65	Stopyra	stopyra10	stopyra123	1
66	Andre	andre01	andre123	2
67	Loic	loic02	loic123	2
68	Fabrice	fabrice03	fabrice123	2
69	Kevin	kevin05	kevin123	2
70	Israel	israel06	israel123	2
71	Caleb	caleb07	caleb123	2
72	Alvin	alvin08	alvin123	2
73	Eva	eva09	Simbaye1989	2
74	David	david01	david123	3
75	Felix	felix02	felix123	3
76	Christopher	christophe03	christophe123	3
77	Jures	Jures04	Jures123	3
78	Toussaint	touss05	touss123	3
79	Fofana	fofa06	fofa123	3
80	Ricot	ricot07	ricot123	3
81	Platini	plati08	plati123	3
82	Pytho	pytho09	pytho123	3
83	Yannick	yann12	yann123	4
84	Andrew	andrew01	andrew123	4
85	Francis	francis02	francis123	4
86	Cedric	cedric03	cedric123	4
87	Shady	shady04	shady123	4
88	Jean-David	jean05	jean123	4
89	Frederic	frederic06	frederic123	4
90	Marvin	marvin07	marvin123	4
91	Blady	blady06	blady123	4
92	Antony	antony07	antony123	4
93	Ambro	ambro12	ambro123	5
94	Heritier	heritier01	heritier123	5
95	Louis	louis02	louis123	5
96	Wesley	wesley03	wesley123	5
97	Israel	israel04	israel123	5
98	Sekou	sekou05	sekou123	5
99	Vincent	vincent06	vincent123	5
100	Roger	roger07	roger123	5
101	Jose	jose06	jose123	5
102	Platiny	platiny07	platiny123	5
103	Nelson	nelson07	nelson123	5
104	Benny	benny04	benny123	6
105	PA	pa05	pa123	6
106	Jean-Paul	paul06	paul123	6
107	Raphael	raph07	raph123	6
108	Michel	michel06	michel123	6
109	Didier	didier07	didier123	6
110	Kamakura	kams07	kams123	6
\.


--
-- Data for Name: presences; Type: TABLE DATA; Schema: public; Owner: zatourexeva
--

COPY public.presences (id, membre_id, date_presence, reunion_id) FROM stdin;
\.


--
-- Data for Name: reunions; Type: TABLE DATA; Schema: public; Owner: zatourexeva
--

COPY public.reunions (id, libelle) FROM stdin;
1	Culte de dimanche
2	Survol doctrinal
3	Groupe de croissance
4	Groupe de Personne
\.


--
-- Name: groupes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zatourexeva
--

SELECT pg_catalog.setval('public.groupes_id_seq', 6, true);


--
-- Name: membres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zatourexeva
--

SELECT pg_catalog.setval('public.membres_id_seq', 110, true);


--
-- Name: presences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zatourexeva
--

SELECT pg_catalog.setval('public.presences_id_seq', 2, true);


--
-- Name: reunions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zatourexeva
--

SELECT pg_catalog.setval('public.reunions_id_seq', 6, true);


--
-- Name: groupes groupes_nom_key; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.groupes
    ADD CONSTRAINT groupes_nom_key UNIQUE (nom);


--
-- Name: groupes groupes_pkey; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.groupes
    ADD CONSTRAINT groupes_pkey PRIMARY KEY (id);


--
-- Name: membres membres_identifiant_key; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.membres
    ADD CONSTRAINT membres_identifiant_key UNIQUE (identifiant);


--
-- Name: membres membres_pkey; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.membres
    ADD CONSTRAINT membres_pkey PRIMARY KEY (id);


--
-- Name: presences presences_membre_id_date_presence_reunion_id_key; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_membre_id_date_presence_reunion_id_key UNIQUE (membre_id, date_presence, reunion_id);


--
-- Name: presences presences_pkey; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_pkey PRIMARY KEY (id);


--
-- Name: reunions reunions_libelle_key; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.reunions
    ADD CONSTRAINT reunions_libelle_key UNIQUE (libelle);


--
-- Name: reunions reunions_pkey; Type: CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.reunions
    ADD CONSTRAINT reunions_pkey PRIMARY KEY (id);


--
-- Name: membres membres_groupe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.membres
    ADD CONSTRAINT membres_groupe_id_fkey FOREIGN KEY (groupe_id) REFERENCES public.groupes(id);


--
-- Name: presences presences_membre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_membre_id_fkey FOREIGN KEY (membre_id) REFERENCES public.membres(id);


--
-- Name: presences presences_reunion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zatourexeva
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_reunion_id_fkey FOREIGN KEY (reunion_id) REFERENCES public.reunions(id);


--
-- PostgreSQL database dump complete
--

