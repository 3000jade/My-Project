export const mockInquiries = [
  {
    id: "inq-101",
    client_name: "Atty. Fernando Zobel",
    client_email: "fzobel@ayala.ph",
    client_phone: "+63 917 888 1234",
    property_id: "1",
    property_title: "Ayala Alabang Estate",
    property_price: "₱185,000,000",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    status: "NEW",
    created_at: "2026-09-04 14:20",
    last_message: "Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?",
    ai_summary: "High-intent buyer inquiring about Ayala Alabang Estate. Requesting Saturday site inspection. Priority VIP lead with immediate scheduling recommendation.",
    messages: [
      {
        id: "msg-1",
        sender: "client",
        sender_name: "Atty. Fernando Zobel",
        timestamp: "2026-09-04 14:20",
        content: "Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?"
      }
    ]
  },
  {
    id: "inq-102",
    client_name: "Dr. Beatrice Ramos-Tan",
    client_email: "b.ramos@medclinic.ph",
    client_phone: "+63 920 901 4455",
    property_id: "2",
    property_title: "The Proscenium Penthouse",
    property_price: "₱85,500,000",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    status: "ASSIGNED",
    created_at: "2026-09-02 09:15",
    last_message: "Thank you for confirming the parking allocation. We will prepare the letter of intent by Tuesday.",
    ai_summary: "Buyer previously asked about 2 deeded parking slots and condominium dues. Agent Elena Rossi answered promptly. Buyer is moving forward to LOI preparation.",
    messages: [
      {
        id: "msg-2",
        sender: "client",
        sender_name: "Dr. Beatrice Ramos-Tan",
        timestamp: "2026-09-02 09:15",
        content: "Hello Elena, does the Proscenium Penthouse come with 2 contiguous basement parking slots?"
      },
      {
        id: "msg-3",
        sender: "agent",
        sender_name: "Elena Rossi",
        timestamp: "2026-09-02 10:05",
        content: "Good morning Dr. Beatrice! Yes, the penthouse includes two deeded contiguous parking slots on Basement 2, directly beside the dedicated penthouse express elevator."
      },
      {
        id: "msg-4",
        sender: "client",
        sender_name: "Dr. Beatrice Ramos-Tan",
        timestamp: "2026-09-02 11:30",
        content: "Thank you for confirming the parking allocation. We will prepare the letter of intent by Tuesday."
      }
    ]
  },
  {
    id: "inq-103",
    client_name: "Engr. Mateo Villanueva",
    client_email: "mvillanueva@buildcon.ph",
    client_phone: "+63 918 333 7654",
    property_id: "3",
    property_title: "Forbes Park Modern Residence",
    property_price: "₱420,000,000",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    status: "REOPENED",
    created_at: "2026-08-28 16:45",
    last_message: "Elena, our financial board has approved the second review. Can we reopen discussion regarding the Forbes Park property boundaries?",
    ai_summary: "Inquiry reopened after previous financial review hiatus. Client wants clarification on property boundaries and setback guidelines under the Forbes Park Association.",
    messages: [
      {
        id: "msg-5",
        sender: "client",
        sender_name: "Engr. Mateo Villanueva",
        timestamp: "2026-08-28 16:45",
        content: "Inquiry regarding title clean status and Forbes Park association transfer fees."
      },
      {
        id: "msg-6",
        sender: "agent",
        sender_name: "Elena Rossi",
        timestamp: "2026-08-29 09:30",
        content: "The title is completely clean and unencumbered under single ownership. Transfer fee details sent to your registered email."
      },
      {
        id: "msg-7",
        sender: "client",
        sender_name: "Engr. Mateo Villanueva",
        timestamp: "2026-09-03 14:10",
        content: "Elena, our financial board has approved the second review. Can we reopen discussion regarding the Forbes Park property boundaries?"
      }
    ]
  },
  {
    id: "inq-104",
    client_name: "Patricia Sy-Cojuangco",
    client_email: "psy@syinvest.com",
    client_phone: "+63 917 222 9901",
    property_id: "4",
    property_title: "One Serendra Garden Villa",
    property_price: "₱68,000,000",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    status: "RESOLVED",
    created_at: "2026-08-15 11:00",
    last_message: "Deal closed and deed of absolute sale signed. Thank you for your exceptional assistance Elena.",
    ai_summary: "Transaction successfully finalized and marked as RESOLVED. Client expressed satisfaction.",
    messages: [
      {
        id: "msg-8",
        sender: "client",
        sender_name: "Patricia Sy-Cojuangco",
        timestamp: "2026-08-15 11:00",
        content: "Is One Serendra Garden Villa still open for ocular inspection?"
      },
      {
        id: "msg-9",
        sender: "agent",
        sender_name: "Elena Rossi",
        timestamp: "2026-08-15 11:45",
        content: "Yes Patricia, we completed inspection and contract preparation."
      },
      {
        id: "msg-10",
        sender: "client",
        sender_name: "Patricia Sy-Cojuangco",
        timestamp: "2026-08-25 17:00",
        content: "Deal closed and deed of absolute sale signed. Thank you for your exceptional assistance Elena."
      }
    ]
  },
  {
    id: "inq-105",
    client_name: "Michael Anthony Cruz",
    client_email: "mcruz@globalcap.sg",
    client_phone: "+65 9123 4567",
    property_id: "6",
    property_title: "Aurelia Residences Horizon Suite",
    property_price: "₱145,000,000",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    status: "NEW",
    created_at: "2026-09-05 08:30",
    last_message: "I am an overseas Filipino executive currently in Singapore. Can we arrange a video walkthrough consultation next week?",
    ai_summary: "Singapore-based executive seeking online video walkthrough for Aurelia Residences Horizon Suite. Requested next week consultation.",
    messages: [
      {
        id: "msg-11",
        sender: "client",
        sender_name: "Michael Anthony Cruz",
        timestamp: "2026-09-05 08:30",
        content: "I am an overseas Filipino executive currently in Singapore. Can we arrange a video walkthrough consultation next week?"
      }
    ]
  },
  {
    id: "inq-106",
    client_name: "Corazon Aquino-Dee",
    client_email: "cdee@deegroup.com",
    client_phone: "+63 917 444 8877",
    property_id: "7",
    property_title: "Greenhills West Contemporary Villa",
    property_price: "₱210,000,000",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    status: "ASSIGNED",
    created_at: "2026-09-01 13:10",
    last_message: "Under review with architect regarding renovation permits.",
    ai_summary: "Prospective buyer reviewing architectural drawings and municipal permits for Greenhills West Villa.",
    messages: [
      {
        id: "msg-12",
        sender: "client",
        sender_name: "Corazon Aquino-Dee",
        timestamp: "2026-09-01 13:10",
        content: "Alexander, does the property come with architectural as-built plans?"
      },
      {
        id: "msg-13",
        sender: "agent",
        sender_name: "Alexander Sterling",
        timestamp: "2026-09-01 14:00",
        content: "Yes Madame Dee, the complete structural and architectural blueprints are available."
      }
    ]
  }
];
