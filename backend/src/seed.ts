import sequelize from "./config/database.js";
import { User, AmbassadorProfile, Referral, Order, Payment, OrderFile, ChatMessage, AuditLog } from "./models/models.js";
import { seedPricingRules } from "./services/pricing.js";
import unixcrypt from "@bonniernews/unixcrypt-js";
import { v4 as uuidv4 } from "uuid";

async function runSeed() {
  console.log("Starting full database seeding...");
  try {
    // 1. Synchronize database (does not drop unless force: true, but we already have clean schema)
    await sequelize.sync();

    // 2. Pricing rules
    await seedPricingRules();

    // 3. System accounts
    const adminEmail = "admin@creackeduhelp.com";
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await User.create({
        id: uuidv4(),
        email: adminEmail,
        hashed_password: unixcrypt.encrypt("adminpass123"),
        full_name: "System Administrator",
        role: "admin",
        is_active: true,
        phone: "+447900000000"
      });
      console.log("Seeded Admin.");
    }

    const specEmail = "specialist@creackeduhelp.com";
    let specialist = await User.findOne({ where: { email: specEmail } });
    if (!specialist) {
      specialist = await User.create({
        id: uuidv4(),
        email: specEmail,
        hashed_password: unixcrypt.encrypt("specpass123"),
        full_name: "Dr. Sarah Jenkins (PPT/Report Specialist)",
        role: "specialist",
        is_active: true,
        phone: "+447900000001"
      });
      console.log("Seeded Specialist.");
    }

    // 4. Seed student accounts
    const s1Email = "student1@creackeduhelp.com";
    let student1 = await User.findOne({ where: { email: s1Email } });
    if (!student1) {
      student1 = await User.create({
        id: uuidv4(),
        email: s1Email,
        hashed_password: unixcrypt.encrypt("student123"),
        full_name: "Alex Rivera",
        role: "student",
        is_active: true,
        phone: "+447911122233",
        university: "University of Manchester"
      });
      console.log("Seeded Student 1.");
    }

    const s2Email = "student2@creackeduhelp.com";
    let student2 = await User.findOne({ where: { email: s2Email } });
    if (!student2) {
      student2 = await User.create({
        id: uuidv4(),
        email: s2Email,
        hashed_password: unixcrypt.encrypt("student123"),
        full_name: "Elena Rostova",
        role: "student",
        is_active: true,
        phone: "+447922233344",
        university: "King's College London"
      });
      console.log("Seeded Student 2.");
    }

    // 5. Seed ambassador account
    const ambEmail = "ambassador@creackeduhelp.com";
    let ambassador = await User.findOne({ where: { email: ambEmail } });
    if (!ambassador) {
      ambassador = await User.create({
        id: uuidv4(),
        email: ambEmail,
        hashed_password: unixcrypt.encrypt("ambassador123"),
        full_name: "Mark Harrison",
        role: "ambassador",
        is_active: true,
        phone: "+447933344455"
      });

      await AmbassadorProfile.create({
        user_id: ambassador.id,
        referral_code: "REF-MARK10",
        referral_url: `/register?ref=REF-MARK10`,
        commission_rate: 10.0,
        balance: 7.50 // Earned 10% on Student 2's completed order (£75.00)
      });
      console.log("Seeded Ambassador & Profile.");
    }

    // 6. Create referral tracks
    const ref1 = await Referral.findOne({ where: { referred_user_id: student1.id } });
    if (!ref1) {
      await Referral.create({
        id: uuidv4(),
        ambassador_id: ambassador.id,
        referred_user_id: student1.id,
        status: "order_placed",
        commission_earned: 0.0
      });
    }

    const ref2 = await Referral.findOne({ where: { referred_user_id: student2.id } });
    if (!ref2) {
      await Referral.create({
        id: uuidv4(),
        ambassador_id: ambassador.id,
        referred_user_id: student2.id,
        status: "paid",
        commission_earned: 7.50
      });
    }

    // 7. Seed Orders
    // Order 1: Submitted, awaiting quote
    const o1Title = "Report Styling & Harvard Citations Audit";
    let order1 = await Order.findOne({ where: { title: o1Title } });
    if (!order1) {
      order1 = await Order.create({
        id: uuidv4(),
        student_id: student1.id,
        title: o1Title,
        university: "University of Manchester",
        course_name: "Business Administration",
        service_type: "Report Formatting",
        task_description: "Please help format the margins, line spacing, and generate a dynamic table of contents. Need references audited and converted to Harvard layout.",
        word_count: 2500,
        slide_count: 0,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority_level: "standard",
        status: "submitted",
        quote_amount: 125.00, // 25 base + 2500 * 0.04
        deposit_amount: 37.50,
        final_amount: 87.50,
        admin_override_quote: false
      });
      console.log("Seeded Order 1.");
    }

    // Order 2: Quoted, awaiting deposit
    const o2Title = "Statistical Charts Layout Formatting";
    let order2 = await Order.findOne({ where: { title: o2Title } });
    if (!order2) {
      order2 = await Order.create({
        id: uuidv4(),
        student_id: student2.id,
        title: o2Title,
        university: "King's College London",
        course_name: "Economics",
        service_type: "Data Analysis",
        task_description: "Format visual data charts, structure regression tables, and adjust margins correctly.",
        word_count: 1000,
        slide_count: 0,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        priority_level: "urgent",
        status: "quoted",
        quote_amount: 150.00, // Overridden by Admin
        deposit_amount: 45.00,
        final_amount: 105.00,
        admin_override_quote: true
      });
      console.log("Seeded Order 2.");
    }

    // Order 3: Assigned & In Progress
    const o3Title = "Clean Slide Deck Layout Styling";
    let order3 = await Order.findOne({ where: { title: o3Title } });
    if (!order3) {
      order3 = await Order.create({
        id: uuidv4(),
        student_id: student1.id,
        specialist_id: specialist.id,
        title: o3Title,
        university: "University of Manchester",
        course_name: "Marketing",
        service_type: "PPT Presentation",
        task_description: "Style presentation slides, limit text blocks, format margins, and choose visual typography colors.",
        word_count: 0,
        slide_count: 12,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority_level: "standard",
        status: "in_progress",
        quote_amount: 120.00, // 30 base + 12 * 6.00 = 102 * 1.0
        deposit_amount: 36.00,
        final_amount: 84.00,
        admin_override_quote: false
      });

      // Seed approved deposit payment
      await Payment.create({
        id: uuidv4(),
        order_id: order3.id,
        student_id: student1.id,
        amount: 36.00,
        payment_type: "deposit",
        payment_method: "wise",
        status: "approved",
        proof_file_key: "avatars/mock_receipt.png",
        verified_by: admin.id,
        verified_at: new Date()
      });

      // Add a chat message
      await ChatMessage.create({
        id: uuidv4(),
        order_id: order3.id,
        sender_id: specialist.id,
        message_text: "Hello Alex, I've received your requirements and will begin aligning the slide grid shortly.",
        attachment_key: null
      });

      console.log("Seeded Order 3 (In Progress).");
    }

    // Order 4: Completed
    const o4Title = "LaTeX Document Layout Tuning";
    let order4 = await Order.findOne({ where: { title: o4Title } });
    if (!order4) {
      order4 = await Order.create({
        id: uuidv4(),
        student_id: student2.id,
        specialist_id: specialist.id,
        title: o4Title,
        university: "King's College London",
        course_name: "Computer Science",
        service_type: "Document Design",
        task_description: "LaTeX document design, margins tuning, and template styling.",
        word_count: 1500,
        slide_count: 0,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority_level: "standard",
        status: "completed",
        quote_amount: 75.00, // 25 base + 10 * 5.0 = 75
        deposit_amount: 22.50,
        final_amount: 52.50,
        admin_override_quote: false
      });

      // Payments
      await Payment.create({
        id: uuidv4(),
        order_id: order4.id,
        student_id: student2.id,
        amount: 22.50,
        payment_type: "deposit",
        payment_method: "wise",
        status: "approved",
        proof_file_key: "avatars/mock_receipt1.png",
        verified_by: admin.id,
        verified_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });

      await Payment.create({
        id: uuidv4(),
        order_id: order4.id,
        student_id: student2.id,
        amount: 52.50,
        payment_type: "final",
        payment_method: "wise",
        status: "approved",
        proof_file_key: "avatars/mock_receipt2.png",
        verified_by: admin.id,
        verified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });

      // Source file
      await OrderFile.create({
        id: uuidv4(),
        order_id: order4.id,
        uploaded_by: student2.id,
        file_name: "source_draft.tex",
        file_key: "orders/mock_source.tex",
        file_size: 15243,
        file_type: "text/x-tex",
        file_category: "source",
        is_clean: true
      });

      // Final file
      await OrderFile.create({
        id: uuidv4(),
        order_id: order4.id,
        uploaded_by: specialist.id,
        file_name: "final_document.pdf",
        file_key: "orders/mock_final.pdf",
        file_size: 452819,
        file_type: "application/pdf",
        file_category: "final",
        is_clean: true
      });

      console.log("Seeded Order 4 (Completed).");
    }

    console.log("All mock data seeded successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await sequelize.close();
  }
}

runSeed();
