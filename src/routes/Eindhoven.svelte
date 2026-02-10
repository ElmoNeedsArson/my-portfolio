<script lang="ts">
    import { onMount } from "svelte";
    import { ChevronDown } from "@lucide/svelte";
    import Outline from "../components/eindhovenOutline.svelte";
    import EindhovenModal from "../components/EindhovenModal.svelte";
    import ExpertiseProjectRankings from "../components/visualizations/ExpertiseProjectRankings.svelte";
    import { loadAllProjects } from "../lib/searchUtils";
    import type { Project } from "../types";

    let headings = [];
    let currentSection = "Professional Identity";
    let currentSubtitle = ""; // Track current subtitle
    let stickyTitle = false;
    let isModalOpen = false;
    let isRankingsExpanded = false;
    let projects: Project[] = [];

    // Load all projects for visualizations
    onMount(() => {
        projects = loadAllProjects();
    });

    function openModal(event: MouseEvent) {
        event.stopPropagation();
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
    }

    const sections = [
        {
            id: "professional-identity",
            title: "Professional Identity",
            subtitles: [],
        },
        {
            id: "vision",
            title: "Vision",
            subtitles: [],
        },
        {
            id: "future-development",
            title: "Future Development",
            subtitles: [
                { id: "short-term", title: "Short Term" },
                { id: "long-term", title: "Long Term" },
                { id: "specialization-tracks", title: "Specialization Track" },
                {
                    id: "courses-and-electives-year-1",
                    title: "Courses and Electives Year 1",
                },
                {
                    id: "courses-and-electives-year-2",
                    title: "Courses and Electives Year 2",
                },
                { id: "beyond-education", title: "Beyond Education" },
            ],
        },
    ];

    onMount(() => {
        // Select h1 and h2 elements inside sections for outline
        const nodes = document.querySelectorAll("section h1, section h2");

        // Convert NodeList → array of objects
        headings = Array.from(nodes).map((node) => ({
            tag: node.tagName.toLowerCase(),
            title: node.textContent.trim(),
            id: node.id || null,
            element: node,
            level: node.tagName.toLowerCase() === "h1" ? 1 : 2,
        }));

        const handleScroll = () => {
            const scrollY = window.scrollY;

            // Simplified sticky logic - just based on scroll position
            stickyTitle = scrollY > 50;

            // Find current section and subtitle
            let newCurrentSection = "Professional Identity";
            let newCurrentSubtitle = "";

            // Check each section from last to first to find which one we're in
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const element = document.getElementById(section.id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + scrollY;

                    // Trigger 1px earlier than scroll position for immediate switching
                    let threshold = 41; // 1px more than scroll offset (50px)
                    if (section.id === "professional-identity") {
                        threshold = 181; // 1px more than scroll offset (180px)
                    }

                    // If we've scrolled past this section's threshold, we're in this section
                    if (scrollY >= elementTop - threshold) {
                        newCurrentSection = section.title;

                        // Now find which subtitle we're in within this section
                        if (section.subtitles && section.subtitles.length > 0) {
                            for (
                                let j = section.subtitles.length - 1;
                                j >= 0;
                                j--
                            ) {
                                const subtitle = section.subtitles[j];
                                const subtitleElement = document.getElementById(
                                    subtitle.id,
                                );
                                if (subtitleElement) {
                                    const subtitleRect =
                                        subtitleElement.getBoundingClientRect();
                                    const subtitleTop =
                                        subtitleRect.top + scrollY;

                                    if (scrollY >= subtitleTop - 100) {
                                        // 100px threshold for subtitles
                                        newCurrentSubtitle = subtitle.title;
                                        break;
                                    }
                                }
                            }
                        }
                        break; // Stop at first section match
                    }
                }
            }

            currentSection = newCurrentSection;
            currentSubtitle = newCurrentSubtitle;
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial call

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    });
</script>

<article class="project-page">
    <div class="sidebar" class:sticky={stickyTitle}>
        <div class="sticky-content">
            <h1>{currentSection}</h1>
            <div class="insert"></div>
            {#if currentSubtitle}
                <h2>{currentSubtitle}</h2>
            {/if}
            <Outline sections={headings} />
        </div>
    </div>
    <div class="content">
        <section id="professional-identity">
            <!-- <button class="open-modal-button" on:click={openModal}>
                Open Modal
            </button> -->

            <h1 id="professional-identity-title" class="hidden-title">
                Professional Identity
            </h1>

            <p>
                I am a designer passionate about combining technology,
                human-centered thinking, and creative problem-solving to shape
                meaningful, user-focused solutions. My Bachelor's in Creative
                Technology at the University of Twente provided a foundation in
                bridging hardware, software, and user needs, a skillset I've
                refined a lot through hands-on projects.<br /><br />

                For example, designing a data physicalization prototype (Figure
                1) deepened my expertise in electronic circuits and iterative
                prototyping, while developing a low-poly video game from scratch
                (Figure 2) improved my ability to translate abstract ideas into
                functional code and custom assets. These experiences taught me
                to embrace technical challenges as opportunities to create
                tangible, user-centric outcomes.<br /><br />

                Beyond academia, my work in a startup crafting cosplay and LARP
                products (Figure 3) immersed me in end-to-end design processes,
                from conceptualizing wearable art to building a responsive web
                shop. This role highlighted the importance of balancing
                creativity with practicality, as I collaborated directly with
                customers to align designs with their needs. Similarly,
                designing an information system for a client (Figure 4) once
                more revealed the value of including stakeholder in the design,
                where they showed me multiple elements they valued I did not
                expect, reinforcing my commitment to inclusive, iterative
                processes. These projects showed the importance of involving
                stakeholders and users in the design to ensure adoption and
                real-world relevance.
            </p>
            <div
                class="gallery"
                style={`grid-template-columns: repeat(3, 1fr);`}
            >
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/Mod8-3.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/Mod8.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/Mod8-2.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <p class="gallery-caption">
                    <i
                        >Figure 1: A data physicalization project I undertook in
                        my bachelor, significantly improving my electronics
                        knowledge and prototyping skill
                    </i>
                </p>
            </div>
            <div
                class="gallery"
                style={`grid-template-columns: repeat(2, 1fr);`}
            >
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/spotty-1.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/spotty-2.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <p class="gallery-caption">
                    <i
                        >Figure 2: Screenshots of a low poly video game made
                        during the bachelor, all the code and assets were
                        created</i
                    >
                </p>
            </div>
            <div
                class="gallery"
                style={`grid-template-columns: repeat(3, 1fr);`}
            >
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/stand1.jpg"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/arm1.jpg"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/work1.jpg"
                        alt="Data Physicalization Project"
                    />
                </div>
                <p class="gallery-caption">
                    <i
                        >Figure 3: Pictures of the startup where we made costume
                        pieces and went to larp and cosplay events to sell
                        stuff, and I made a web shop for</i
                    >
                </p>
            </div>
            <div
                class="gallery"
                style={`grid-template-columns: repeat(3, 1fr);`}
            >
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/lms-1.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/lms-2.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <div class="gallery-item">
                    <img
                        src="../assets/images/eindhoven/lms-3.png"
                        alt="Data Physicalization Project"
                    />
                </div>
                <p class="gallery-caption">
                    <i
                        >Figure 4: Screenshots of said information system
                        application</i
                    >
                </p>
            </div>

            <p>
                In my design approach, flexibility is key. I adapt methodologies
                to fit the unique needs of each project, drawing from diverse
                frameworks to find the most effective process. In group
                projects, I prioritize a clear and structured approach to ensure
                transparency and accountability. On the other hand, my personal
                projects often follow a more spontaneous path driven by
                curiosity and exploration, allowing me to experiment freely and
                learn by doing.<br /><br />

                What drives me in my work is a focus on solving problems. Over
                time, I've grown more confident in my ability to tackle
                challenges by breaking them down and applying my skillset. I
                used to see personal motivation as the main factor for
                completing projects, and also my biggest pitfall, since it can
                be an unstable factor for specializing. But I've noticed that
                over time and with my education in my bachelor and the
                acquisition of skills my motivation shifted to the process
                itself and the satisfaction of finding solutions are what keep
                me going. I'm still navigating the balance between
                specialization and generalization, as I'm driven both by a
                desire to master specific skills and by the excitement of
                connecting diverse ideas across fields.
            </p>

            <p>
                I value optimism and open-mindedness, believing these traits
                fuel creativity, collaboration, and motivation. My strength lies
                in connecting people and disciplines, facilitating inclusive,
                stakeholder-driven design processes [3] where diverse
                perspectives lead to innovative outcomes. In team settings, I
                naturally gravitate toward coordination, ensuring all voices are
                heard and ideas are shared collaboration as a cornerstone of
                impactful design, and I actively work to create an environment
                where inclusivity drives innovation. While I thrive in
                collaborative environments, I sometimes struggle when others
                show a lack of initiative, which can lead me to take over tasks
                to maintain momentum. I'm aware that this tendency could hinder
                team dynamics, and I aim to improve my ability to navigate these
                situations, as it will likely also be part of future
                professional settings.<br /><br />

                In summary, I am a designer dedicated to leveraging technology
                thoughtfully and responsibly, balancing creativity, technical
                skills, and human-centered design to craft solutions that make a
                meaningful impact.
            </p>
        </section>

        <!-- Collapsible Project Rankings Section -->
        <div class="rankings-section">
            <button
                class="rankings-toggle"
                on:click={() => (isRankingsExpanded = !isRankingsExpanded)}
                aria-expanded={isRankingsExpanded}
            >
                <span class="rankings-toggle-text"
                    >Browse Projects by Expertise Area</span
                >
                <ChevronDown
                    size={20}
                    class="chevron-icon {isRankingsExpanded ? 'expanded' : ''}"
                />
            </button>

            {#if isRankingsExpanded}
                <div class="rankings-content">
                    <ExpertiseProjectRankings {projects} />
                </div>
            {/if}
        </div>

        <div class="rounded"></div>

        <section id="vision">
            <h1 id="vision-title" class="hidden-title">Vision</h1>
            <p>
                Currently, and for the last 2 decades more and more elements are
                being replaced or extended with the help of technological tools.
                My vision as a designer is to implement these technological
                advancements in a meaningful way beside just throwing technical
                solutions at a problem, an example of this is the current trend
                of embedding AI in a lot of places, without considering the
                consequences it brings along [4]. A term that aptly describes
                this is 'Techno-Solutionism' [5], the belief that technology
                alone can solve all problems, often overlooking the complexity
                of certain problems. I recognize that in my design process I
                have a tendency to look for digital solutions, therefor my
                vision is partly dedicated to finding the right balance between
                leveraging technology and recognizing when no technology, or
                physical forms of technology might be a better choice.<br /><br
                />

                Two areas of interest that nicely touch upon this are human
                computer interaction (HCI) and embodied design. I want to be a
                designer that is capable of bridging these forms of technology
                and bodily experience. So to be a designer that can design
                technical applications that take bodily experience as an
                important part of the design process and intended goal. When
                reading about embodied design, for me it feels like it is an
                optimal intersection of technology and physical aspects, where
                you take the best aspects of both and try to combine it into an
                efficient learning activity or more interactive experience, some
                papers showcase the potential and added value of this
                combination [8]. This balance requires deep technical
                proficiency as well as a human-centered approach. By
                familiarizing myself and deepening my knowledge on diverse
                technologies and actively engaging with users, I aim to create
                solutions that enhance user adoption, satisfaction, and overall
                impact and provide real value to the user.<br /><br />

                An example of this balance was in my bachelor graduation project
                I aimed to improve educational digital games with a focus on
                users needs, such as enjoyment, motivation and knowledge
                retention. I designed a way to include useful learning elements,
                such as a briefing and debriefing, into an educational game
                improving its efficiency as a learning activity, while
                maintaining the fun of a game. Even though my solution was fully
                digital, in my user testing I once more found out how valuable
                interfacing with physical communication is when I compared my
                two test groups, where physical interactions showed improved
                'knowledge retention' in certain areas. Now this concept is not
                new, and areas such as embodied design touch upon this quite a
                lot. This project taught me a lot already on how physical parts
                of a technological solution can enhance reaching its goal. I
                want to see the world become more balanced in its application of
                technology, and how it can enrich for example education [9]. As
                a designer this balance is something I want to seek out in any
                application where technology could play a meaningful role. I
                have an interest in applying this knowledge in education, but it
                might not be the thing that interests me the most, a part of my
                future development would be to find out what does, “which area
                of application interests me”.<br /><br />

                As this designer I have a responsibility to shape the
                meaningfulness of technology in our lives. Each design decision
                should be guided by questioning whether this implementation
                truly adds value, by critically evaluating its impact on the
                people around it with the help of frameworks currently being
                used in embodied design and HCI. In my professional identity, I
                emphasize human-centered, stakeholder-driven design as a way to
                ensure relevance, adoption, and meaningful impact. I should
                carefully consider the extreme impact my design can have with
                small the choices I make
            </p>
        </section>

        <div class="rounded"></div>

        <section id="future-development">
            <h1 id="future-development-title" class="hidden-title">
                Future Development
            </h1>
            <h2 id="short-term" class="hidden-title">Short Term</h2>
            <div class="past_present_future">
                <div>Past</div>
                <div>Present</div>
                <div>Future</div>
                <div>
                    Lot of Technical Development Mainly: Math, Data & Computing;
                    Technology and Realization
                </div>
                <div>
                    (This master): Deepening of Math, Data & Computing and
                    expansion into embodied and user centered design
                </div>
                <div>Become confident in combination of the two</div>
            </div>
            <p>
                In my vision as a designer, I believe that technology should not
                be applied indiscriminately but with careful consideration of
                when it truly enhances the user experience. This principle
                extends beyond just digital solutions and into the physical
                realm, where I want to explore embodied interaction and
                learning. To do so, I want to focus on deepening my
                technological proficiencies, to know what options are and when
                to apply them, and a focus on users. Working with embodied
                interaction, perception and learning will allow me to deepen my
                understanding of human-centered aspects of design that are often
                overlooked in purely digital contexts. It strengthens my ability
                to create intuitive, user-friendly products by considering the
                physical interaction before integrating any technological
                elements.
            </p>

            <div class="goals">
                <div class="goal">
                    <h3>Independence</h3>
                    <p>
                        From my M11 project, I identified I was rather dependent
                        on reassurance. I want to shift toward being more secure
                        in my own choices without requesting constant
                        confirmation. By the end of the semester, I want to
                        confidently be able to say I refrained from constant
                        confirmation as much as possible, and reflect on the
                        (dis)advantages of this.
                    </p>
                    <div class="expertise_area">Professional Development</div>
                </div>

                <div class="goal">
                    <h3>Confidence in backend development and security</h3>
                    <p>
                        To overcome my tendency to sidestep backend work and do
                        everything frontend or in an application that
                        encompasses all in one already. I want to design,
                        implement, and deploy a secure backend, such as an API
                        for user data collection. This process involves
                        selecting appropriate libraries, tests for error
                        handling, setting up authentication mechanisms, and
                        configuring logging and backup workflows. By semester's
                        end, I want to have a publicly accessible, documented
                        prototype that safely ingests and stores participant
                        responses.
                    </p>
                    <div class="expertise_area">User & Society</div>
                </div>

                <div class="goal">
                    <h3>Comfort with quantitative data</h3>
                    <p>
                        I want to improve my comfort with quantitative data
                        collection, not on the statistical element, but
                        recognizing my avoidance of social risk in recruiting. I
                        want to attempt to recruit beyond familiar networks (and
                        convenience sampling). This includes reaching out, and
                        designing around it. At the end of the semester I want
                        to confirm I reached out, and attempted to gather
                        participants outside of the “easy way”.
                    </p>
                    <div class="expertise_area">User & Society</div>
                </div>

                <div class="goal">
                    <h3>Independence</h3>
                    <p>
                        Additionally for math, data & computing I would like to
                        become more programmatically proficient in simple data
                        smoothing and cleaning. Methods such as a moving
                        average, or filtering out outliers I have not used in
                        previous projects with the exception of a failsafe
                        if-statement that fixes the data if it gets out of
                        bounds. I would like to learn about safer and better
                        data handling practices, either during my M12 research
                        project or my Digital Twin Elective, and include this
                        knowledge in a prototype.
                    </p>
                    <div class="expertise_area">Math, Data and Computing</div>
                </div>

                <div class="goal">
                    <h3>Improve Data handling Fluency</h3>
                    <p>
                        With the digital twins elective in Q3 and the creativity
                        and aesthetics of data and AI elective, I want to get a
                        more workfield oversight of data handling and storage.
                        So no more beginner projects with local storing of .txt
                        or .json files in my repositories, but using a database,
                        such as SQLite, to know more about standard data
                        interactions. At the end of either course I want to have
                        a prototype that incorporates this. (Perhaps using data
                        foundry as an easy access point)
                    </p>
                    <div class="expertise_area">Math, Data and Computing</div>
                </div>

                <div class="goal">
                    <h3>
                        (Personal Goal): Presenting my self and my competences
                    </h3>
                    <p>
                        This is not a competence development but I would like to
                        update and upgrade my portfolio to make it more
                        manageable and usable for other people, and to update my
                        linkedIn profile and CV, and get feedback on it, by
                        people currently in the work field.
                    </p>
                    <div class="expertise_area">Professional Development</div>
                    <!-- <div class="expertise_area">Math, Data and Computing</div> -->
                </div>
            </div>

            <div class="insert"></div>

            <h2 id="long-term" class="hidden-title">Long Term</h2>
            <p>
                Taking my vision and professional Identity into account, I
                already see an emphasizes leveraging technology thoughtfully and
                responsibly while recognizing its human impact. To link this to
                expertise areas, I intend to deepen my expertise in Math, Data,
                and Computing (MDC) and Technology and Realization (T&R) to
                enhance my technical skills. These areas resonate strongly with
                my passion for building meaningful and innovative solutions.
                Simultaneously, as per my vision, I'll continue integrating
                insights from User and Society (U&S) to ensure that my designs
                have real-world relevance and impact, connecting technical
                innovation with human-centered approaches. This dual focus will
                allow me to act even better as a connector, bridging technical
                disciplines (e.g., electrical engineering, computer science, and
                mechanical engineering) and the societal and environmental
                impact of my designs, fostering a holistic approach to design.
            </p>

            <div class="insert"></div>

            <h2 id="specialization-tracks" class="hidden-title">
                Specialization Track
            </h2>
            <p>
                I would like to pursue the Design Leadership and
                Entrepreneurship track (DLE) since the model (see quote) of
                graduates as defined in the study guide website, is the one that
                resonates most with me. Interestingly enough, the related
                electives did originally not appeal to me, but the description
                of the person related to this track does suit me rather well,
                this model as described here, is very often the role that I take
                in any university or personal projects, and I identify with. The
                <mark>connector role</mark>, and my motivation behind projects,
                as described in my Professional identity relates to this as
                well.
            </p>
            <div class="quote">
                <p>
                    “Industrial designers that develop a start-up; based on a
                    product or a service or aim at implementing a design vision
                    within companies and organizations, they need to take the
                    lead to implement their vision”
                </p>
            </div>

            <p>
                This track might allow me to fill that role with even better
                knowledge and skills, thereby allowing the role that I like
                most, to be executed more smoothly and efficiently, and perhaps
                even pleasantly. This will also create a useful skillset for
                ventures after my master's.
            </p>

            <div class="insert"></div>

            <div class="education-timeline">
                <div class="timeline-section">
                    <h2 id="courses-and-electives-year-1">
                        Courses and Electives - Year 1
                    </h2>
                    <p>
                        The selected courses align with my vision as a designer to
                        thoughtfully integrate advanced technologies in meaningful,
                        human-centered ways. Courses like Interactional Morality and
                        Values-Based Leadership (DLE track course) strengthen my ability
                        to critically evaluate the societal and ethical impact of my
                        designs, by fostering a deep understanding of the broader
                        implications of design decisions on users, organizations, and
                        society.
                    </p>
                    <p>
                        In addition, courses such as Creativity and Aesthetics of Data &
                        AI, Designing with Advanced AI, and Designing with and for
                        Digital Twins will deepen my technical expertise in machine
                        learning, digital twins, and other advanced technologies while
                        exploring their creative and expressive potential. These
                        subjects directly support my short- and long-term goals of
                        expanding technical skills in areas like Math, Data, and
                        Computing (MDC) and Technology and Realization (T&R) while
                        connecting them to creative, real-world applications.
                    </p>
                </div>

                <div class="timeline-section">
                    <h2 id="courses-and-electives-year-2">
                        Courses and Electives - Year 2
                    </h2>
                    <p>
                        In the second year of my master's program, I plan to broaden my
                        design perspective by studying abroad at either Aalto University
                        or the Technical University of Copenhagen. Both institutions
                        offer opportunities to complement my current skillset: Aalto's
                        focus on practical, hands-on design approaches will enhance my
                        ability to prototype and iterate effectively, while Copenhagen's
                        emphasis on more technical subjects will allow me to deepen my
                        expertise in areas like artificial intelligence, digital
                        systems, and data-driven design. I think in addition that this
                        experience will contribute to me potentially growing as a person
                        by creating more and broader experiences.
                    </p>
                    <p>
                        For my Final Master Project (FMP), I aim to integrate advanced
                        technologies, such as AI, digital twins, or interactive systems,
                        into educational settings to explore how these tools can enhance
                        learning experiences. Building on my prior experience in
                        educational digital games and my coursework in advanced AI and
                        digital design tools, my FMP will reflect my dedication to
                        creating meaningful, user-centered solutions that balance
                        technological innovation with human .
                    </p>
                </div>

                <div class="timeline-section">
                    <h2 id="beyond-education">Beyond Education</h2>
                    <p>
                        After/during my current master, I am tempted to address my
                        interest for education with the double education master TU/E
                        offers, I want to gather some more information about the options
                        and possibilities in this regard (With an information session on
                        the 10th of March). However, another way to address this
                        interest is by pursuing another master's program after my
                        current master. Scandinavia being my preferred destination due
                        to the availability of tuition-free education in Sweden. I've
                        already looked into the duration and associated costs, and I'm
                        considering programs such as the master's in education or
                        Serious Games (educational games) offered at the University of
                        Skövde.
                    </p>
                    <p>
                        Lifelong learning is really an approach that aligns with my
                        interests. And if I come to work somewhere eventually, I feel
                        like my curiosity and determination will prove valuable and
                        useful. These attributes also help me in my personal projects I
                        like to undertake beside my master.
                    </p>
                    <p>
                        For instance, I am currently developing a plugin [6] for the
                        note-taking application Obsidian [7]. The plugin has been
                        accepted into the platform's official plugin list, allowing
                        others to download and use it. This project has taught / is
                        teaching me a big deal on dealing with bigger code repositories
                        and writing code according to external standards. This and
                        similar projects are things I enjoy undertaking in my spare
                        time, and hope to continue doing so far beyond my master.
                    </p>
                </div>
            </div>

            <div class="insert"></div>
        </section>

        <section id="sources">
            <h1 id="future-development-title" class="hidden-title">
                Future Development
            </h1>
            <h1 id="sources" class="hidden-title">Sources</h1>
            <ol type="1">
                <p>
                    <li>
                        <a href="https://www.context.org/iclib/ic27/orr/"
                            >https://www.context.org/iclib/ic27/orr/</a
                        >
                    </li>

                    <li>
                        I. Koskinen, <i
                            >Design research through practice: From the Lab,
                            Field, and Showroom</i
                        >. Elsevier, 2011.
                    </li>

                    <li>
                        <a
                            href="https://link.springer.com/article/10.1057/jit.1994.6"
                            >https://link.springer.com/article/10.1057/jit.1994.6</a
                        >
                    </li>

                    <li>
                        Zhai, C., Wibowo, S. & Li, L.D. The effects of
                        over-reliance on AI dialogue systems on students’
                        cognitive abilities: a systematic review. <i
                            >Smart Learn. Environ.</i
                        >11, 28 (2024).<a
                            href="https://doi.org/10.1186/s40561-024-00316-7"
                            >https://doi.org/10.1186/s40561-024-00316-7</a
                        >
                    </li>

                    <li>
                        Mitra, S., Raskin, J., & Pansera, M. (2023). Role of ICT
                        innovation in perpetuating the myth of
                        Techno-Solutionism. arXiv (Cornell University). <a
                            href="https://doi.org/10.48550/arxiv.2309.12355"
                            >https://doi.org/10.48550/arxiv.2309.12355</a
                        >
                    </li>

                    <li>ElmoNeedsArson/Obsidian-3D-embed</li>

                    <li>Obsidian - Sharpen your thinking</li>

                    <li>
                        Wilde, D., Tomico, O., Lucero, A., Höök, K. & Buur, J.
                        (2015). Embodying embodied design research techniques. <i
                            >Aarhus Series on Human Centered Computing</i
                        >, 1(1), 4.
                        <a href="https://doi.org/10.7146/aahcc.v1i1.21620"
                            >https://doi.org/10.7146/aahcc.v1i1.21620</a
                        >
                    </li>

                    <li>
                        Bakker, S., Van Den Hoven, E. & Antle, A.N. (2010). MoSo
                        tangibles. ACM, 85-92. <a
                            href="https://doi.org/10.1145/1935701.1935720"
                            >https://doi.org/10.1145/1935701.1935720</a
                        >
                    </li>
                </p>
            </ol>
        </section>
    </div>
</article>

<EindhovenModal bind:isOpen={isModalOpen} {projects} on:close={closeModal} />

<style>
    :root {
        --professional-identity-border-color: rgba(74, 144, 226, 0.3);
        --vision-border-color: rgba(155, 89, 182, 0.3);
        --future-development-border-color: rgba(230, 126, 34, 0.3);
    }

    #professional-identity {
        border-left: 4px solid var(--professional-identity-border-color);
        padding-left: 1rem;
        background: linear-gradient(
            to bottom,
            transparent,
            rgba(74, 144, 226, 0.08)
        );
    }

    #vision {
        border-left: 4px solid var(--vision-border-color);
        padding-left: 1rem;
        background: linear-gradient(
            to bottom,
            rgba(155, 89, 182, 0.08),
            rgba(155, 89, 182, 0.08)
        );
    }

    #future-development {
        background: linear-gradient(
            to bottom,
            rgba(230, 126, 34, 0.08),
            transparent
        );
        border-left: 4px solid var(--future-development-border-color);
        padding-left: 1rem;
    }

    mark {
        background-color: transparent;
        color: var(--secondary-text-color);
        font-weight: 800;
    }

    ol li {
        margin-bottom: 12px; /* increase or decrease for more/less spacing */
    }

    .project-page {
        color: var(--primary-text-color);
        display: grid;
        grid-template-columns: minmax(0, 1fr) 5fr; /* Prevent column from expanding beyond 1fr */
        gap: 2rem;
        position: relative;
    }

    .sidebar {
        position: relative;
        height: fit-content;
        transition: all 0.3s ease; /* Exclude width from transition */
        overflow: visible; /* Allow content to show in normal mode */
        min-width: 0; /* Allow content to shrink */
    }

    .sidebar.sticky {
        position: sticky;
        top: 10px;
        z-index: 10;
        background: transparent;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-height: calc(100vh - 20px);
        overflow-y: auto; /* Allow scrolling when content is too tall */
        width: fit-content;
        max-width: 90%; /* Use percentage of available space instead of fixed pixels */
        min-width: min(200px, 100%); /* Responsive minimum width */
    }

    /* Custom scrollbar styling to reduce visual impact */
    .sidebar.sticky::-webkit-scrollbar {
        width: 4px;
    }

    .sidebar.sticky::-webkit-scrollbar-track {
        background: transparent;
    }

    .sidebar.sticky::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
    }

    .sidebar.sticky::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.4);
    }

    .sticky-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .content {
        position: relative;
        min-width: 0;
        max-width: 100%;
        overflow-x: hidden;
    }

    section {
        /* margin-bottom: 4rem; */
        scroll-margin-top: 120px; /* Adjusted to work with improved sticky logic */
        min-width: 0;
        max-width: 100%;
    }

    /* #vision{
        background-color: var(--inverted-bg-color);
    }

    #vision p {
        color: var(--inverted-text-color);
    } */

    .rounded {
        border-top: 2px solid var(--secondary-text-color);
        border-radius: 100%;
    }

    .insert {
        width: 10%;
        border-top: 2px solid var(--secondary-text-color);
    }

    h1 {
        text-align: left;
        margin-bottom: 0;
    }

    .sidebar h1 {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        word-break: break-word;
    }

    .sidebar h2 {
        text-align: left;
        margin-top: 0;
        margin-bottom: 0;
        font-size: 1rem;
        font-weight: 400;
        color: var(--muted-color, #666);
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        word-break: break-word;
    }

    .hidden-title {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        margin: 0;
        padding: 0;
    }

    .quote {
        border-left: 4px solid var(--border-color);
        /* margin: 1.5rem 0; */
        padding-left: 1rem;
        color: var(--muted-color);
        font-style: italic;
    }

    p {
        text-align: justify;
        font-size: 0.94rem;
        line-height: 1.5rem;
        margin-bottom: 1.5rem;
        letter-spacing: 0.5px;
    }

    .past_present_future {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 2rem 0;
        text-align: center;
    }

    .goals {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1.5rem;
        row-gap: 4rem;
        margin-bottom: 2rem;
    }

    .goal p,
    .goal {
        font-size: 0.7rem;
    }

    .expertise_area {
        text-align: end;
    }

    /* Education Timeline 3-column layout */
    .education-timeline {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 2rem 0;
    }

    .timeline-section {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        background: rgba(0, 0, 0, 0.02);
        transition: all 0.3s ease;
    }

    .timeline-section:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .timeline-section h2 {
        /* font-size: 1.1rem; */
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--secondary-text-color);
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 0.5rem;
    }

    .timeline-section p {
        margin-bottom: 1rem;
    }

    .timeline-section p:last-child {
        margin-bottom: 0;
    }

    /* Responsive: stack on medium screens */
    @media (max-width: 1024px) {
        .education-timeline {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
    }

    .gallery {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 0rem 0;
        align-items: stretch;
    }

    .gallery-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        border-radius: 6px;
    }

    .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 6px;
    }

    .gallery-caption {
        width: 100%;
        text-align: center;
        margin-top: 1rem;
        font-style: italic;
        color: var(--muted-color);
        grid-column: 1 / -1;
        margin-top: 0px;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .project-page {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .sidebar.sticky {
            position: relative;
            top: auto;
            width: auto;
            background: transparent;
            box-shadow: none;
            padding: 0;
        }

        .goals {
            grid-template-columns: 1fr;
            row-gap: 2rem;
        }

        p {
            margin-right: 1.5rem;
        }
    }

    .open-modal-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        margin-bottom: 1.5rem;
        background-color: var(--button-background);
        color: var(--primary-text-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .open-modal-button:hover {
        background-color: var(--hover-color);
        border-color: var(--primary-text-color);
    }

    /* Collapsible Rankings Section */
    .rankings-section {
        margin: 2rem 0;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--background-color);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    .rankings-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background: var(--background-color);
        border: none;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-text-color);
        transition: all 0.2s ease;
    }

    .rankings-toggle:hover {
        background: var(--hover-color);
    }

    .rankings-toggle-text {
        font-size: 1.1rem;
    }

    .rankings-toggle :global(.chevron-icon) {
        transition: transform 0.3s ease;
        flex-shrink: 0;
    }

    .rankings-toggle :global(.chevron-icon.expanded) {
        transform: rotate(180deg);
    }

    .rankings-content {
        border-top: 2px solid var(--border-color);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        padding: 0 0.25rem 0.75rem 0.25rem;
    }
</style>
