<script>
    import { onMount } from "svelte";
    import Outline from "../components/eindhovenOutline.svelte";

    let headings = [];
    let currentSection = "Professional Identity";
    let stickyTitle = false;

    const sections = [
        { id: "professional-identity", title: "Professional Identity" },
        { id: "vision", title: "Vision" },
        { id: "future-development", title: "Future Development" }
    ];

    onMount(() => {
        // Select only h1 elements inside sections (not the sidebar)
        const nodes = document.querySelectorAll("section h1");

        // Convert NodeList → array of objects
        headings = Array.from(nodes).map((node) => ({
            tag: node.tagName.toLowerCase(), // 'h1' or 'h4'
            title: node.textContent.trim(),
            id: node.id || null,
            element: node, // optional, reference to DOM node
            level: node.tagName.toLowerCase() === "h1" ? 1 : 2,
        }));

        const handleScroll = () => {
            const scrollY = window.scrollY;

            // Simplified sticky logic - just based on scroll position
            stickyTitle = scrollY > 50;
            console.log("Scroll Y:", scrollY, "Sticky:", stickyTitle); // Debug log

            // Find current section based on scroll position - simplified approach
            let newCurrentSection = "Professional Identity"; // Default to first section
            
            // Check each section from last to first to find which one we're in
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const element = document.getElementById(section.id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + scrollY;
                    
                    // Trigger 1px earlier than scroll position for immediate switching
                    let threshold = 51; // 1px more than scroll offset (50px)
                    if (section.id === 'professional-identity') {
                        threshold = 181; // 1px more than scroll offset (180px)
                    }
                    
                    // If we've scrolled past this section's threshold, we're in this section
                    if (scrollY >= elementTop - threshold) {
                        newCurrentSection = section.title;
                        break; // Stop at first match (going backwards means this is the current section)
                    }
                }
            }
            
            currentSection = newCurrentSection;
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial call

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });
</script>

<Outline sections={headings} isHeaderSticky={stickyTitle} />

<article class="project-page">
    <div class="sidebar" class:sticky={stickyTitle}>
        <h1>{currentSection}</h1>
    </div>
    <div class="content">
        <section id="professional-identity">
            <h1 id="professional-identity-title" class="hidden-title">Professional Identity</h1>
            <p>
                I am a designer passionate about combining technology,
                human-centered thinking, and creative problem-solving to shape
                meaningful, user-focused solutions. My Bachelor's in Creative
                Technology at the University of Twente provided a foundation in
                bridging hardware, software, and user needs, a skillset I've refined
                a lot through hands-on projects.<br /><br />

                For example, designing a data physicalization prototype (Figure 1)
                deepened my expertise in electronic circuits and iterative
                prototyping, while developing a low-poly video game from scratch
                (Figure 2) improved my ability to translate abstract ideas into
                functional code and custom assets. These experiences taught me to
                embrace technical challenges as opportunities to create tangible,
                user-centric outcomes.<br /><br />

                Beyond academia, my work in a startup crafting cosplay and LARP
                products (Figure 3) immersed me in end-to-end design processes, from
                conceptualizing wearable art to building a responsive web shop. This
                role highlighted the importance of balancing creativity with
                practicality, as I collaborated directly with customers to align
                designs with their needs. Similarly, designing an information system
                for a client (Figure 4) once more revealed the value of including
                stakeholder in the design, where they showed me multiple elements
                they valued I did not expect, reinforcing my commitment to
                inclusive, iterative processes. These projects showed the importance
                of involving stakeholders and users in the design to ensure adoption
                and real-world relevance.
            </p>
        <div class="gallery" style={`grid-template-columns: repeat(3, 1fr);`}>
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
                    >Figure 1: A data physicalization project I undertook in my
                    bachelor, significantly improving my electronics knowledge
                    and prototyping skill
                </i>
            </p>
        </div>
        <div class="gallery" style={`grid-template-columns: repeat(2, 1fr);`}>
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
                    >Figure 2: Screenshots of a low poly video game made during
                    the bachelor, all the code and assets were created</i
                >
            </p>
        </div>
        <div class="gallery" style={`grid-template-columns: repeat(3, 1fr);`}>
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
                    pieces and went to larp and cosplay events to sell stuff,
                    and I made a web shop for</i
                >
            </p>
        </div>
        <div class="gallery" style={`grid-template-columns: repeat(3, 1fr);`}>
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
            In my design approach, flexibility is key. I adapt methodologies to
            fit the unique needs of each project, drawing from diverse
            frameworks to find the most effective process. In group projects, I
            prioritize a clear and structured approach to ensure transparency
            and accountability. On the other hand, my personal projects often
            follow a more spontaneous path driven by curiosity and exploration,
            allowing me to experiment freely and learn by doing.<br /><br />

            What drives me in my work is a focus on solving problems. Over time,
            I've grown more confident in my ability to tackle challenges by
            breaking them down and applying my skillset. I used to see personal
            motivation as the main factor for completing projects, and also my
            biggest pitfall, since it can be an unstable factor for
            specializing. But I've noticed that over time and with my education
            in my bachelor and the acquisition of skills my motivation shifted
            to the process itself and the satisfaction of finding solutions are
            what keep me going. I'm still navigating the balance between
            specialization and generalization, as I'm driven both by a desire to
            master specific skills and by the excitement of connecting diverse
            ideas across fields.<br /><br />

            I value optimism and open-mindedness, believing these traits fuel
            creativity, collaboration, and motivation. My strength lies in
            connecting people and disciplines, facilitating inclusive,
            stakeholder-driven design processes [3] where diverse perspectives
            lead to innovative outcomes. In team settings, I naturally gravitate
            toward coordination, ensuring all voices are heard and ideas are
            shared collaboration as a cornerstone of impactful design, and I
            actively work to create an environment where inclusivity drives
            innovation. While I thrive in collaborative environments, I
            sometimes struggle when others show a lack of initiative, which can
            lead me to take over tasks to maintain momentum. I'm aware that this
            tendency could hinder team dynamics, and I aim to improve my ability
            to navigate these situations, as it will likely also be part of
            future professional settings.<br /><br />

            In summary, I am a designer dedicated to leveraging technology
            thoughtfully and responsibly, balancing creativity, technical
            skills, and human-centered design to craft solutions that make a
            meaningful impact.
        </p>
        </section>

        <section id="vision">
            <h1 id="vision-title" class="hidden-title">Vision</h1>
            <p>
                Currently, and for the last 2 decades more and more elements are being replaced or extended with the help of technological tools. My vision as a designer is to implement these technological advancements in a meaningful way beside just throwing technical solutions at a problem, an example of this is the current trend of embedding AI in a lot of places, without considering the consequences it brings along [4]. A term that aptly describes this is ‘Techno-Solutionism’ [5], the belief that technology alone can solve all problems, often overlooking the complexity of certain problems. I recognize that in my design process I have a tendency to look for digital solutions, therefor my vision is partly dedicated to finding the right balance between leveraging technology and recognizing when no technology, or physical forms of technology might be a better choice.<br><br>

Two areas of interest that nicely touch upon this are human computer interaction (HCI) and embodied design. I want to be a designer that is capable of bridging these forms of technology and bodily experience. So to be a designer that can design technical applications that take bodily experience as an important part of the design process and intended goal. When reading about embodied design, for me it feels like it is an optimal intersection of technology and physical aspects, where you take the best aspects of both and try to combine it into an efficient learning activity or more interactive experience, some papers showcase the potential and added value of this combination [8]. This balance requires deep technical proficiency as well as a human-centered approach. By familiarizing myself and deepening my knowledge on diverse technologies and actively engaging with users, I aim to create solutions that enhance user adoption, satisfaction, and overall impact and provide real value to the user.<br><br>

An example of this balance was in my bachelor graduation project I aimed to improve educational digital games with a focus on users needs, such as enjoyment, motivation and knowledge retention. I designed a way to include useful learning elements, such as a briefing and debriefing, into an educational game improving its efficiency as a learning activity, while maintaining the fun of a game. Even though my solution was fully digital, in my user testing I once more found out how valuable interfacing with physical communication is when I compared my two test groups, where physical interactions showed improved 'knowledge retention' in certain areas. Now this concept is not new, and areas such as embodied design touch upon this quite a lot. This project taught me a lot already on how physical parts of a technological solution can enhance reaching its goal. I want to see the world become more balanced in its application of technology, and how it can enrich for example education [9]. As a designer this balance is something I want to seek out in any application where technology could play a meaningful role. I have an interest in applying this knowledge in education, but it might not be the thing that interests me the most, a part of my future development would be to find out what does, “which area of application interests me”.<br><br>

As this designer I have a responsibility to shape the meaningfulness of technology in our lives. Each design decision should be guided by questioning whether this implementation truly adds value, by critically evaluating its impact on the people around it with the help of frameworks currently being used in embodied design and HCI. In my professional identity, I emphasize human-centered, stakeholder-driven design as a way to ensure relevance, adoption, and meaningful impact. I should carefully consider the extreme impact my design can have with small the choices I make
            </p>
        </section>

        <section id="future-development">
            <h1 id="future-development-title" class="hidden-title">Future Development</h1>
            <p>
                In my vision as a designer, I believe that technology should not be applied indiscriminately but with careful consideration of when it truly enhances the user experience. This principle extends beyond just digital solutions and into the physical realm, where I want to explore embodied interaction and learning. To do so, I want to focus on deepening my technological proficiencies, to know what options are and when to apply them, and a focus on users. Working with embodied interaction, perception and learning will allow me to deepen my understanding of human-centered aspects of design that are often overlooked in purely digital contexts. It strengthens my ability to create intuitive, user-friendly products by considering the physical interaction before integrating any technological elements.
            </p>
        </section>
    </div>
</article>

<style>
    .project-page {
        color: var(--primary-text-color);
        display: grid;
        grid-template-columns: 1fr 4fr;
        gap: 2rem;
        position: relative;
    }

    .sidebar {
        position: relative;
        height: fit-content;
        transition: all 0.3s ease;
    }

    .sidebar.sticky {
        position: sticky;
        top: 10px;
        z-index: 10;
        background: var(--background-color, #fff);
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .content {
        position: relative;
    }

    section {
        margin-bottom: 4rem;
        scroll-margin-top: 120px; /* Adjusted to work with improved sticky logic */
    }

    h1 {
        text-align: left;
        margin-bottom: 2rem;
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

    p {
        text-align: justify;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    .gallery {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 2rem 0;
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
    }
</style>
