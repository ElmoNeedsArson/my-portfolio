<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import CanvasCard from "./CanvasCard.svelte";
  import CanvasArrow from "./CanvasArrow.svelte";
  import CanvasNavigation from "./CanvasNavigation.svelte";
  import { X, Maximize2 } from "@lucide/svelte";

  export let isPreview = true;

  let isFullscreen = false;
  let canvasElement: HTMLElement;
  let canvasContentElement: HTMLElement;
  let zoom = 0.58;
  let panX = 800;
  let panY = 4;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let cardsMounted = false;

  // Touch interaction state
  let touchStartDistance = 0;
  let touchStartZoom = 0;
  let lastTouchDistance = 0;

  // Target positions for smooth animation
  let targetPanX: number | null = null;
  let targetPanY: number | null = null;
  let targetZoom: number | null = null;
  let animationFrame: number | null = null;

  // Card data structure - positions are in canvas coordinates
  // Layout: Row 1: Professional Identity | Vision
  //         Row 2: Future Development | Short Term Goals | Long Term
  //         Row 3+: Specialization, Courses, Beyond Education
  // Cards are 1200px wide
  // You can use functions for x/y to reference other cards: () => getCard("card-id")!.x + offset
  const cardDefinitions = [
    {
      id: "professional-identity",
      title: "Professional Identity",
      x: 100,
      y: 100,
      width: 1200,
      color: "rgba(74, 144, 226, 0.35)",
      sections: [
        {
          type: 'content',
          content: "I am a designer passionate about combining technology, human-centered thinking, and creative problem-solving to shape meaningful, user-focused solutions. My Bachelor's in Creative Technology at the University of Twente provided a foundation in bridging hardware, software, and user needs, a skillset I've refined a lot through hands-on projects.\n\nFor example, designing a data physicalization prototype (Figure 1) deepened my expertise in electronic circuits and iterative prototyping, while developing a low-poly video game from scratch (Figure 2) improved my ability to translate abstract ideas into functional code and custom assets. These experiences taught me to embrace technical challenges as opportunities to create tangible, user-centric outcomes."
        },
        
        {
          type: 'content',
          content: "Beyond academia, my work in a startup crafting cosplay and LARP products (Figure 3) immersed me in end-to-end design processes, from conceptualizing wearable art to building a responsive web shop. This role highlighted the importance of balancing creativity with practicality, as I collaborated directly with customers to align designs with their needs. Similarly, designing an information system for a client (Figure 4) once more revealed the value of including stakeholder in the design, where they showed me multiple elements they valued I did not expect, reinforcing my commitment to inclusive, iterative processes. These projects showed the importance of involving stakeholders and users in the design to ensure adoption and real-world relevance."
        },
                {
          type: 'images',
          cols: 3,
          images: [
            {
              src: "/assets/images/eindhoven/Mod8-3.png",
              alt: "Data Physicalization Project",
            },
            {
              src: "/assets/images/eindhoven/Mod8.png",
              alt: "Data Physicalization Project",
            },
            {
              src: "/assets/images/eindhoven/Mod8-2.png",
              alt: "Data Physicalization Project",
            },
          ],
          caption: "Figure 1: A data physicalization project I undertook in my bachelor, significantly improving my electronics knowledge and prototyping skill"
        },
                {
          type: 'images',
          cols: 2,
          images: [
            {
              src: "/assets/images/eindhoven/spotty-1.png",
              alt: "Low poly video game",
            },
            {
              src: "/assets/images/eindhoven/spotty-2.png",
              alt: "Low poly video game",
            },
          ],
          caption: "Figure 2: Screenshots of a low poly video game made during the bachelor, all the code and assets were created"
        },
        {
          type: 'images',
          cols: 3,
          images: [
            {
              src: "/assets/images/eindhoven/stand1.jpg",
              alt: "Startup booth",
            },
            { src: "/assets/images/eindhoven/arm1.jpg", alt: "Costume piece" },
            { src: "/assets/images/eindhoven/work1.jpg", alt: "Workshop" },
          ],
          caption: "Figure 3: Pictures of the startup where we made costume pieces and went to larp and cosplay events to sell stuff, and I made a web shop for"
        },
        {
          type: 'images',
          cols: 3,
          images: [
            {
              src: "/assets/images/eindhoven/lms-1.png",
              alt: "Information system",
            },
            {
              src: "/assets/images/eindhoven/lms-2.png",
              alt: "Information system",
            },
            {
              src: "/assets/images/eindhoven/lms-3.png",
              alt: "Information system",
            },
          ],
          caption: "Figure 4: Screenshots of said information system application"
        },
        {
          type: 'content',
          content: "In my design approach, flexibility is key. I adapt methodologies to fit the unique needs of each project, drawing from diverse frameworks to find the most effective process. In group projects, I prioritize a clear and structured approach to ensure transparency and accountability. On the other hand, my personal projects often follow a more spontaneous path driven by curiosity and exploration, allowing me to experiment freely and learn by doing.\n\nWhat drives me in my work is a focus on solving problems. Over time, I've grown more confident in my ability to tackle challenges by breaking them down and applying my skillset. I used to see personal motivation as the main factor for completing projects, and also my biggest pitfall, since it can be an unstable factor for specializing. But I've noticed that over time and with my education in my bachelor and the acquisition of skills my motivation shifted to the process itself and the satisfaction of finding solutions are what keep me going. I'm still navigating the balance between specialization and generalization, as I'm driven both by a desire to master specific skills and by the excitement of connecting diverse ideas across fields.\n\nI value optimism and open-mindedness, believing these traits fuel creativity, collaboration, and motivation. My strength lies in connecting people and disciplines, facilitating inclusive, stakeholder-driven design processes where diverse perspectives lead to innovative outcomes. In team settings, I naturally gravitate toward coordination, ensuring all voices are heard and ideas are shared collaboration as a cornerstone of impactful design, and I actively work to create an environment where inclusivity drives innovation. While I thrive in collaborative environments, I sometimes struggle when others show a lack of initiative, which can lead me to take over tasks to maintain momentum. I'm aware that this tendency could hinder team dynamics, and I aim to improve my ability to navigate these situations, as it will likely also be part of future professional settings.\n\nIn summary, I am a designer dedicated to leveraging technology thoughtfully and responsibly, balancing creativity, technical skills, and human-centered design to craft solutions that make a meaningful impact."
        }
      ]
    },
    {
      id: "vision",
      title: "Vision",
      x: () =>
        (cardDefinitions.find((c) => c.id === "professional-identity")!
          .x as number) + 1300,
      y: () =>
        cardDefinitions.find((c) => c.id === "professional-identity")!
          .y as number,
      width: 1200,
      color: "rgba(249, 103, 67, 0.35)",
      sections: [
        {
          type: 'content',
          content: "Currently, and for the last 2 decades more and more elements are being replaced or extended with the help of technological tools. My vision as a designer is to implement these technological advancements in a meaningful way beside just throwing technical solutions at a problem, an example of this is the current trend of embedding AI in a lot of places, without considering the consequences it brings along. A term that aptly describes this is 'Techno-Solutionism', the belief that technology alone can solve all problems, often overlooking the complexity of certain problems. I recognize that in my design process I have a tendency to look for digital solutions, therefor my vision is partly dedicated to finding the right balance between leveraging technology and recognizing when no technology, or physical forms of technology might be a better choice.\n\nTwo areas of interest that nicely touch upon this are human computer interaction (HCI) and embodied design. I want to be a designer that is capable of bridging these forms of technology and bodily experience. So to be a designer that can design technical applications that take bodily experience as an important part of the design process and intended goal. When reading about embodied design, for me it feels like it is an optimal intersection of technology and physical aspects, where you take the best aspects of both and try to combine it into an efficient learning activity or more interactive experience, some papers showcase the potential and added value of this combination. This balance requires deep technical proficiency as well as a human-centered approach. By familiarizing myself and deepening my knowledge on diverse technologies and actively engaging with users, I aim to create solutions that enhance user adoption, satisfaction, and overall impact and provide real value to the user.\n\nAn example of this balance was in my bachelor graduation project I aimed to improve educational digital games with a focus on users needs, such as enjoyment, motivation and knowledge retention. I designed a way to include useful learning elements, such as a briefing and debriefing, into an educational game improving its efficiency as a learning activity, while maintaining the fun of a game. Even though my solution was fully digital, in my user testing I once more found out how valuable interfacing with physical communication is when I compared my two test groups, where physical interactions showed improved 'knowledge retention' in certain areas. Now this concept is not new, and areas such as embodied design touch upon this quite a lot. This project taught me a lot already on how physical parts of a technological solution can enhance reaching its goal. I want to see the world become more balanced in its application of technology, and how it can enrich for example education. As a designer this balance is something I want to seek out in any application where technology could play a meaningful role. I have an interest in applying this knowledge in education, but it might not be the thing that interests me the most, a part of my future development would be to find out what does, \"which area of application interests me\".\n\nAs this designer I have a responsibility to shape the meaningfulness of technology in our lives. Each design decision should be guided by questioning whether this implementation truly adds value, by critically evaluating its impact on the people around it with the help of frameworks currently being used in embodied design and HCI. In my professional identity, I emphasize human-centered, stakeholder-driven design as a way to ensure relevance, adoption, and meaningful impact. I should carefully consider the extreme impact my design can have with small the choices I make"
        }
      ]
    },
    {
      id: "future-development",
      title: "Future Development",
      x: 2700,
      y: 1000,
      width: 1200,
      color: "rgba(155, 89, 182, 0.35)",
      sections: [
        {
          type: 'content',
          content: "In my vision as a designer, I believe that technology should not be applied indiscriminately but with careful consideration of when it truly enhances the user experience. This principle extends beyond just digital solutions and into the physical realm, where I want to explore embodied interaction and learning. To do so, I want to focus on deepening my technological proficiencies, to know what options are and when to apply them, and a focus on users. Working with embodied interaction, perception and learning will allow me to deepen my understanding of human-centered aspects of design that are often overlooked in purely digital contexts. It strengthens my ability to create intuitive, user-friendly products by considering the physical interaction before integrating any technological elements."
        }
      ]
    },
    {
      id: "specialization",
      title: "Specialization Track",
      x: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .x as number) + 1300,
      y: () =>
        cardDefinitions.find((c) => c.id === "future-development")!.y as number,
      width: 1200,
      color: "rgba(249, 103, 67, 0.25)",
      sections: [
        {
          type: 'content',
          content: 'I would like to pursue the Design Leadership and Entrepreneurship track (DLE) since the model of graduates as defined in the study guide website, is the one that resonates most with me. Interestingly enough, the related electives did originally not appeal to me, but the description of the person related to this track does suit me rather well, this model as described here, is very often the role that I take in any university or personal projects, and I identify with. The connector role, and my motivation behind projects, as described in my Professional identity relates to this as well.\n\n"Industrial designers that develop a start-up; based on a product or a service or aim at implementing a design vision within companies and organizations, they need to take the lead to implement their vision"\n\nThis track might allow me to fill that role with even better knowledge and skills, thereby allowing the role that I like most, to be executed more smoothly and efficiently, and perhaps even pleasantly. This will also create a useful skillset for ventures after my master\'s.'
        }
      ]
    },
    {
      id: "short-term",
      title: "Short Term Goals",
      x: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .x as number) - 1300,
      y: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .y as number) + 500,
      width: 1200,
      color: "rgba(155, 89, 182, 0.25)",
      sections: [
        {
          type: 'content',
          content: '**Independence:** From my M11 project, I identified I was rather dependent on reassurance. I want to shift toward being more secure in my own choices without requesting constant confirmation. By the end of the semester, I want to confidently be able to say I refrained from constant confirmation as much as possible, and reflect on the (dis)advantages of this.\n\n**Confidence in backend development and security:** To overcome my tendency to sidestep backend work and do everything frontend or in an application that encompasses all in one already. I want to design, implement, and deploy a secure backend, such as an API for user data collection. This process involves selecting appropriate libraries, tests for error handling, setting up authentication mechanisms, and configuring logging and backup workflows. By semester\'s end, I want to have a publicly accessible, documented prototype that safely ingests and stores participant responses.\n\n**Comfort with quantitative data:** I want to improve my comfort with quantitative data collection, not on the statistical element, but recognizing my avoidance of social risk in recruiting. I want to attempt to recruit beyond familiar networks (and convenience sampling). This includes reaching out, and designing around it. At the end of the semester I want to confirm I reached out, and attempted to gather participants outside of the "easy way".\n\n**Data smoothing and cleaning:** Additionally for math, data & computing I would like to become more programmatically proficient in simple data smoothing and cleaning. Methods such as a moving average, or filtering out outliers I have not used in previous projects with the exception of a failsafe if-statement that fixes the data if it gets out of bounds. I would like to learn about safer and better data handling practices, either during my M12 research project or my Digital Twin Elective, and include this knowledge in a prototype.\n\n**Improve Data handling Fluency:** With the digital twins elective in Q3 and the creativity and aesthetics of data and AI elective, I want to get a more workfield oversight of data handling and storage. So no more beginner projects with local storing of .txt or .json files in my repositories, but using a database, such as SQLite, to know more about standard data interactions. At the end of either course I want to have a prototype that incorporates this. (Perhaps using data foundry as an easy access point)\n\n**(Personal Goal) Presenting my self and my competences:** This is not a competence development but I would like to update and upgrade my portfolio to make it more manageable and usable for other people, and to update my linkedIn profile and CV, and get feedback on it, by people currently in the work field.'
        }
      ]
    },
    {
      id: "long-term",
      title: "Long Term",
      x: () =>
        cardDefinitions.find((c) => c.id === "future-development")!.x as number,
      y: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .y as number) + 500,
      width: 1200,
      color: "rgba(74, 144, 226, 0.25)",
      sections: [
        {
          type: 'content',
          content: "Taking my vision and professional Identity into account, I already see an emphasizes leveraging technology thoughtfully and responsibly while recognizing its human impact. To link this to expertise areas, I intend to deepen my expertise in Math, Data, and Computing (MDC) and Technology and Realization (T&R) to enhance my technical skills. These areas resonate strongly with my passion for building meaningful and innovative solutions. Simultaneously, as per my vision, I'll continue integrating insights from User and Society (U&S) to ensure that my designs have real-world relevance and impact, connecting technical innovation with human-centered approaches. This dual focus will allow me to act even better as a connector, bridging technical disciplines (e.g., electrical engineering, computer science, and mechanical engineering) and the societal and environmental impact of my designs, fostering a holistic approach to design."
        }
      ]
    },
    {
      id: "courses-year-1",
      title: "Courses and Electives - Year 1",
      x: () =>
        cardDefinitions.find((c) => c.id === "future-development")!.x as number,
      y: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .y as number) + 850,
      width: 1200,
      color: "rgba(155, 89, 182, 0.25)",
      sections: [
        {
          type: 'content',
          content: "The selected courses align with my vision as a designer to thoughtfully integrate advanced technologies in meaningful, human-centered ways. Courses like Interactional Morality and Values-Based Leadership (DLE track course) strengthen my ability to critically evaluate the societal and ethical impact of my designs, by fostering a deep understanding of the broader implications of design decisions on users, organizations, and society.\n\nIn addition, courses such as Creativity and Aesthetics of Data & AI, Designing with Advanced AI, and Designing with and for Digital Twins will deepen my technical expertise in machine learning, digital twins, and other advanced technologies while exploring their creative and expressive potential. These subjects directly support my short- and long-term goals of expanding technical skills in areas like Math, Data, and Computing (MDC) and Technology and Realization (T&R) while connecting them to creative, real-world applications."
        }
      ]
    },
    {
      id: "courses-year-2",
      title: "Courses and Electives - Year 2",
      x: () =>
        cardDefinitions.find((c) => c.id === "future-development")!.x as number,
      y: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .y as number) + 1250,
      width: 1200,
      color: "rgba(74, 144, 226, 0.3)",
      sections: [
        {
          type: 'content',
          content: "In the second year of my master's program, I plan to broaden my design perspective by studying abroad at either Aalto University or the Technical University of Copenhagen. Both institutions offer opportunities to complement my current skillset: Aalto's focus on practical, hands-on design approaches will enhance my ability to prototype and iterate effectively, while Copenhagen's emphasis on more technical subjects will allow me to deepen my expertise in areas like artificial intelligence, digital systems, and data-driven design. I think in addition that this experience will contribute to me potentially growing as a person by creating more and broader experiences.\n\nFor my Final Master Project (FMP), I aim to integrate advanced technologies, such as AI, digital twins, or interactive systems, into educational settings to explore how these tools can enhance learning experiences. Building on my prior experience in educational digital games and my coursework in advanced AI and digital design tools, my FMP will reflect my dedication to creating meaningful, user-centered solutions that balance technological innovation with human ."
        }
      ]
    },
    {
      id: "beyond-education",
      title: "Beyond Education",
      x: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .x as number) + 1300,
      y: () =>
        (cardDefinitions.find((c) => c.id === "future-development")!
          .y as number) + 500,
      width: 1200,
      color: "rgba(249, 103, 67, 0.3)",
      sections: [
        {
          type: 'content',
          content: "After/during my current master, I am tempted to address my interest for education with the double education master TU/E offers, I want to gather some more information about the options and possibilities in this regard (With an information session on the 10th of March). However, another way to address this interest is by pursuing another master's program after my current master. Scandinavia being my preferred destination due to the availability of tuition-free education in Sweden. I've already looked into the duration and associated costs, and I'm considering programs such as the master's in education or Serious Games (educational games) offered at the University of Skövde.\n\nLifelong learning is really an approach that aligns with my interests. And if I come to work somewhere eventually, I feel like my curiosity and determination will prove valuable and useful. These attributes also help me in my personal projects I like to undertake beside my master.\n\nFor instance, I am currently developing a plugin for the note-taking application Obsidian. The plugin has been accepted into the platform's official plugin list, allowing others to download and use it. This project has taught / is teaching me a big deal on dealing with bigger code repositories and writing code according to external standards. This and similar projects are things I enjoy undertaking in my spare time, and hope to continue doing so far beyond my master."
        }
      ]
    },
  ];

  // Helper function to get a card by ID from definitions
  const getCard = (id: string) => cardDefinitions.find((c) => c.id === id);

  // Compute final card positions (evaluates functions for relative positioning)
  const cards = cardDefinitions.map((card) => ({
    ...card,
    x: typeof card.x === "function" ? card.x() : card.x,
    y: typeof card.y === "function" ? card.y() : card.y,
  }));

  // Arrow connections - connect cards by their IDs with edge positions and optional waypoints
  // Waypoints create 90-degree turns for cleaner routing
  const connections = [
    {
      from: "professional-identity",
      fromSide: "right" as const,
      to: "vision",
      toSide: "left" as const,
      waypoints: [
        { x: 1350, y: 1312 },
        { x: 1350, y: 611 },
      ],
    },

    {
      from: "vision",
      fromSide: "right" as const,
      to: "future-development",
      toSide: "top" as const,
      waypoints: [
        { x: 3300, y: 611 },
      ],
    },
    // Future Development → Long Term (vertical, same column)
    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "long-term",
      toSide: "top" as const,
      waypoints: [],
    },

    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "short-term",
      toSide: "top" as const,
      waypoints: [
        { x: 2700 + 600, y: 1500 - 52 },
        { x: 1400 + 600, y: 1500 - 52 },
      ],
    },

    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "beyond-education",
      toSide: "top" as const,
      waypoints: [
        { x: 2700 + 600, y: 1500 - 52 },
        { x: 4000 + 600, y: 1500 - 52 },
      ],
    },

    // Long Term → Courses Year 1 (vertical, same column)
    {
      from: "long-term",
      fromSide: "bottom" as const,
      to: "courses-year-1",
      toSide: "top" as const,
      waypoints: [],
    },

    // Courses Year 1 → Year 2 (vertical)
    {
      from: "courses-year-1",
      fromSide: "bottom" as const,
      to: "courses-year-2",
      toSide: "top" as const,
      waypoints: [],
    },
  ];

  // Reactive arrow points - recalculate when cards are mounted
  $: arrowData = cardsMounted && connections.map(connection => ({
    connection,
    points: getArrowPoints(connection)
  }));

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Get mouse position relative to canvas
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate position in canvas coordinates before zoom
    const canvasXBefore = (mouseX - panX) / zoom;
    const canvasYBefore = (mouseY - panY) / zoom;

    // Update zoom with min/max limits
    const zoomDelta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.15, Math.min(3, zoom + zoomDelta));

    // Calculate position in canvas coordinates after zoom
    const canvasXAfter = (mouseX - panX) / newZoom;
    const canvasYAfter = (mouseY - panY) / newZoom;

    // Adjust pan to keep mouse position consistent
    panX += (canvasXAfter - canvasXBefore) * newZoom;
    panY += (canvasYAfter - canvasYBefore) * newZoom;

    zoom = newZoom;
  }

  function handleMouseDown(e: MouseEvent) {
    // Only pan with left mouse button
    if (e.button !== 0) return;

    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    canvasElement.style.cursor = "grabbing";

    console.log("Pan start:", { startX, startY });
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPanning) return;

    panX = e.clientX - startX;
    panY = e.clientY - startY;

    console.log("Panning:", { panX, panY });
  }

  function handleMouseUp() {
    isPanning = false;
    canvasElement.style.cursor = "grab";
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      // Single finger - pan
      isPanning = true;
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pinch zoom
      isPanning = false;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      lastTouchDistance = touchStartDistance;
      touchStartZoom = zoom;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
      // Single finger pan
      const touch = e.touches[0];
      panX = touch.clientX - startX;
      panY = touch.clientY - startY;
    } else if (e.touches.length === 2) {
      // Two finger pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate current distance between fingers
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom center (midpoint between fingers)
      const rect = canvasElement.getBoundingClientRect();
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
      
      // Calculate canvas position before zoom
      const canvasXBefore = (centerX - panX) / zoom;
      const canvasYBefore = (centerY - panY) / zoom;
      
      // Calculate new zoom based on distance change
      const scale = currentDistance / touchStartDistance;
      const newZoom = Math.max(0.15, Math.min(3, touchStartZoom * scale));
      
      // Calculate canvas position after zoom
      const canvasXAfter = (centerX - panX) / newZoom;
      const canvasYAfter = (centerY - panY) / newZoom;
      
      // Adjust pan to keep center position consistent
      panX += (canvasXAfter - canvasXBefore) * newZoom;
      panY += (canvasYAfter - canvasYBefore) * newZoom;
      
      zoom = newZoom;
      lastTouchDistance = currentDistance;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      isPanning = false;
      touchStartDistance = 0;
      touchStartZoom = 0;
    } else if (e.touches.length === 1) {
      // Went from 2 fingers to 1, restart pan
      isPanning = true;
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
      touchStartDistance = 0;
    }
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;

    // Hide body scrollbar when fullscreen
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function getCardEdgePoint(
    cardId: string,
    side: "top" | "bottom" | "left" | "right",
  ): { x: number; y: number } {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return { x: 0, y: 0 };

    // Get actual height from DOM (offsetHeight is not affected by CSS transforms)
    const cardElement = cardsMounted ? canvasContentElement?.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement : null;
    const actualHeight = cardElement?.offsetHeight || 300;
    if (cardElement) {
      console.log(`Card ${cardId}:`, {
        offsetHeight: cardElement.offsetHeight,
        clientHeight: cardElement.clientHeight,
        scrollHeight: cardElement.scrollHeight,
        boundingRect: cardElement.getBoundingClientRect().height,
        usingHeight: actualHeight
      });
    }
    const headerHeight = 60; // Card header

    switch (side) {
      case "top":
        return { x: card.x + card.width / 2, y: card.y };
      case "bottom":
        return { x: card.x + card.width / 2, y: card.y + actualHeight };
      case "left":
        return {
          x: card.x,
          y: card.y + actualHeight / 2,
        };
      case "right":
        return {
          x: card.x + card.width,
          y: card.y + actualHeight / 2,
        };
    }
  }

  function getArrowPoints(
    connection: (typeof connections)[0],
  ): Array<{ x: number; y: number }> {
    const start = getCardEdgePoint(connection.from, connection.fromSide);
    const end = getCardEdgePoint(connection.to, connection.toSide);

    // Build points array: start -> waypoints -> end
    return [start, ...(connection.waypoints || []), end];
  }

  function getCardCenter(cardId: string): { x: number; y: number } {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return { x: 0, y: 0 };

    // Estimate card height based on content length
    const estimatedHeight = Math.max(
      200,
      Math.ceil(card.content.length / 6) + 100,
    );

    return {
      x: card.x + card.width / 2,
      y: card.y + estimatedHeight / 2,
    };
  }

  function animateToTarget() {
    if (targetPanX === null || targetPanY === null || targetZoom === null) {
      animationFrame = null;
      return;
    }

    const easeSpeed = 0.1; // Adjust for faster/slower animation
    const threshold = 0.5; // Stop animating when close enough

    const panXDiff = targetPanX - panX;
    const panYDiff = targetPanY - panY;
    const zoomDiff = targetZoom - zoom;

    if (
      Math.abs(panXDiff) < threshold &&
      Math.abs(panYDiff) < threshold &&
      Math.abs(zoomDiff) < 0.01
    ) {
      // Animation complete
      panX = targetPanX;
      panY = targetPanY;
      zoom = targetZoom;
      targetPanX = null;
      targetPanY = null;
      targetZoom = null;
      animationFrame = null;
      return;
    }

    // Ease towards target
    panX += panXDiff * easeSpeed;
    panY += panYDiff * easeSpeed;
    zoom += zoomDiff * easeSpeed;

    animationFrame = requestAnimationFrame(animateToTarget);
  }

  function navigateToCard(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || !canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    
    // Get actual height from DOM if available
    const cardElement = canvasContentElement?.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
    const actualHeight = cardElement?.offsetHeight || 600;

    // Calculate target position to show the top of the card
    const targetZoomLevel = 0.6; // Zoom level to view the card
    const cardCenterX = card.x + card.width / 2;
    const cardTopY = card.y;

    // Calculate pan to center horizontally, but show from the top vertically
    targetPanX = rect.width / 2 - cardCenterX * targetZoomLevel;
    targetPanY = rect.height * 0.15 - cardTopY * targetZoomLevel; // 15% from top for some padding

    targetZoom = targetZoomLevel;

    // Start animation if not already running
    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
  }

  onMount(async () => {
    // Wait for cards to be in DOM
    await tick();
    cardsMounted = true;
    
    // Anchor to top-left showing Professional Identity card
    if (isPreview && canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const professionalIdentityCard = cards.find(
        (c) => c.id === "professional-identity",
      );

      if (professionalIdentityCard) {
        // Calculate zoom to fit card width with some margin
        const cardWidth = professionalIdentityCard.width;
        const availableWidth = rect.width * 0.9; // Use 90% of viewport width
        const calculatedZoom = Math.min(0.55, availableWidth / cardWidth); // Max zoom 0.7

        // Position card at top-left with small margin
        const marginX = 50;
        const marginY = 50;

        zoom = calculatedZoom;
        panX = marginX - professionalIdentityCard.x * zoom;
        panY = marginY - professionalIdentityCard.y * zoom;
      }
    }
  });

  onDestroy(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

<div class="canvas-wrapper" class:fullscreen={isFullscreen}>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    class="infinite-canvas"
    class:preview={isPreview && !isFullscreen}
    bind:this={canvasElement}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}
    role="application"
    tabindex="0"
    aria-label="Infinite canvas with content cards"
  >
    <!-- Dot grid background -->
    <div
      class="dot-grid"
      style="transform: translate({panX}px, {panY}px) scale({zoom})"
    ></div>

    <!-- Canvas content with transformation -->
    <div
      bind:this={canvasContentElement}
      class="canvas-content"
      style="transform: translate({panX}px, {panY}px) scale({zoom})"
    >
      <!-- Arrows (rendered first so they appear below cards) -->
      <svg class="arrows-layer">
        {#if arrowData}
          {#each arrowData as {points}}
            <CanvasArrow {points} />
          {/each}
        {/if}
      </svg>

      <!-- Cards -->
      {#each cards as card (card.id)}
        <CanvasCard
          cardId={card.id}
          x={card.x}
          y={card.y}
          width={card.width}
          title={card.title}
          color={card.color}
          sections={card.sections}
        />
      {/each}
    </div>

    <!-- Enlarge/Close button -->
    {#if isPreview && !isFullscreen}
      <button
        class="canvas-action-button enlarge"
        on:click={toggleFullscreen}
        type="button"
      >
        <Maximize2 size={16} />
        Enlarge
      </button>
    {/if}

    {#if isFullscreen}
      <button
        class="canvas-action-button close"
        on:click={toggleFullscreen}
        type="button"
      >
        <X size={20} />
      </button>
    {/if}

    <!-- Canvas Navigation Widget -->
    <CanvasNavigation {cards} onNavigate={navigateToCard} {isFullscreen} />
  </div>
</div>

<style>
  .canvas-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 2.5rem;
  }

  .canvas-wrapper.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    margin: 0;
    background: var(
      --background-color
    ); /* Solid background to hide page content */
  }

  .infinite-canvas {
    position: relative;
    width: 100%;
    height: 75vh; /* Preview mode height - adjust this value (e.g., 50vh, 70vh) */
    overflow: hidden;
    cursor: grab;
    background: var(--secondary-background-color);
    border-radius: 9px;
    user-select: none;
  }

  .infinite-canvas.preview {
    min-height: 75vh; /* Should match height above */
  }

  .canvas-wrapper.fullscreen .infinite-canvas {
    border-radius: 0;
    height: 100vh; /* Full height in fullscreen mode */
  }

  .dot-grid {
    position: absolute;
    left: -10000px;
    top: -10000px;
    width: 20000px;
    height: 20000px;
    background-image: radial-gradient(
      circle,
      var(--muted-color) 2px,
      transparent 1.5px
    );
    background-size: 40px 40px;
    background-position: 0 0;
    transform-origin: 10000px 10000px;
    pointer-events: none;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    width: 100%;
    height: 100%;
  }

  .arrows-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 2000px;
    height: 2000px;
    pointer-events: none;
    overflow: visible;
  }

  .canvas-action-button {
    position: absolute;
    z-index: 10;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--hover-color);
    backdrop-filter: blur(10px);
    color: var(--primary-text-color);
    font-size: 0.85rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .canvas-action-button:hover {
    background: var(--secondary-background-color);
    border-color: var(--secondary-text-color);
  }

  .canvas-action-button.enlarge {
    top: 1.25rem;
    right: 1.25rem;
  }

  .canvas-action-button.close {
    top: 1.25rem;
    right: 1.25rem;
    padding: 0.5rem;
  }

  .infinite-canvas:active {
    cursor: grabbing;
  }

  /* Print styles for PDF export */
  @media print {
    .canvas-wrapper {
      position: static;
      margin: 0;
    }

    .infinite-canvas {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      border-radius: 0;
      transform: scale(0.6);
      transform-origin: top left;
    }

    .canvas-content {
      position: static !important;
      transform: none !important;
    }

    .dot-grid {
      display: none;
    }

    .canvas-action-button,
    :global(.canvas-navigation) {
      display: none !important;
    }
  }
</style>
