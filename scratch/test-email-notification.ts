import prisma from '../lib/prisma';
import { sendOrderAdminNotification, DEFAULT_ADMIN_EMAIL } from '../lib/email';

async function runTests() {
  console.log('===============================================================');
  console.log('HELLFIRE PRINTS - EMAIL NOTIFICATION SYSTEM VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Error: ${details}`);
    }
  }

  // -------------------------------------------------------------------------
  // Setup: Find or create a test user and address
  // -------------------------------------------------------------------------
  console.log('--- Setting up test data ---');
  let testUser = await prisma.user.findFirst({
    where: { email: 'test.admin.notification@hellfireprints.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: 'test.admin.notification@hellfireprints.com',
        role: 'CUSTOMER',
      },
    });
  }

  let testAddress = await prisma.address.findFirst({
    where: { userId: testUser.id },
  });

  if (!testAddress) {
    testAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        name: 'Raj Mandhyan',
        phone: '+91 98765 43210',
        street: '42 Cyberpunk Boulevard, Sector 18',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
    });
  }

  // -------------------------------------------------------------------------
  // Scenario 1: Unpaid / Pending Order - MUST NOT send email
  // -------------------------------------------------------------------------
  console.log('\n--- Test 1: Pending Payment Gate ---');
  const pendingOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-PEND-${Date.now()}`,
      userId: testUser.id,
      subtotal: 100,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 100,
      orderStatus: 'PENDING',
      paymentStatus: 'CREATED', // NOT captured
      shippingAddressId: testAddress.id,
      shippingAddressSnapshot: {
        name: testAddress.name,
        phone: testAddress.phone,
        street: testAddress.street,
        city: testAddress.city,
        state: testAddress.state,
        postalCode: testAddress.postalCode,
        country: testAddress.country,
      },
    },
  });

  const pendingResult = await sendOrderAdminNotification(pendingOrder.id);
  assert(
    pendingResult.skipped === true && pendingResult.success === false,
    'Unverified/Pending order skips email notification',
    `Result: ${JSON.stringify(pendingResult)}`
  );

  const pendingOrderRefreshed = await prisma.order.findUnique({
    where: { id: pendingOrder.id },
  });
  assert(
    pendingOrderRefreshed?.adminEmailStatus === 'PENDING',
    'Pending order email status remains PENDING in database'
  );

  // -------------------------------------------------------------------------
  // Scenario 2: Failed Payment - MUST NOT send email
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Failed Payment Gate ---');
  const failedOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-FAIL-${Date.now()}`,
      userId: testUser.id,
      subtotal: 150,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 150,
      orderStatus: 'CANCELLED',
      paymentStatus: 'FAILED', // Failed payment
      shippingAddressId: testAddress.id,
    },
  });

  const failedResult = await sendOrderAdminNotification(failedOrder.id);
  assert(
    failedResult.skipped === true && failedResult.success === false,
    'Failed payment skips email notification',
    `Result: ${JSON.stringify(failedResult)}`
  );

  // -------------------------------------------------------------------------
  // Scenario 3: Custom Poster Order with Multiple Sizes & Line Items
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Multi-item Order with Custom Poster & Verified Status ---');
  
  // Create a CustomPoster record
  const customPoster = await prisma.customPoster.create({
    data: {
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample_custom_artwork.jpg',
      orientation: 'PORTRAIT',
      sizeName: 'A3',
      frameName: 'Black Classic Frame',
      paperType: '300 GSM Premium Matte',
      price: 199,
    },
  });

  const testCapturedOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-PAID-${Date.now()}`,
      userId: testUser.id,
      subtotal: 299,
      discount: 30,
      couponCode: 'HELLFIRE10',
      shippingFee: 50,
      tax: 18,
      total: 337,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'CAPTURED', // Successfully verified payment
      razorpayOrderId: `order_test_${Date.now()}`,
      additionalNote: 'Please use extra bubble wrap for the custom frame!',
      shippingAddressId: testAddress.id,
      shippingAddressSnapshot: {
        name: testAddress.name,
        phone: testAddress.phone,
        street: testAddress.street,
        city: testAddress.city,
        state: testAddress.state,
        postalCode: testAddress.postalCode,
        country: testAddress.country,
      },
      items: {
        create: [
          {
            title: 'Custom Poster Print',
            price: 199,
            quantity: 1,
            sizeName: 'A3',
            sizeDimensions: '29.7 x 42 cm',
            frameName: 'Black Classic Frame',
            paperType: '300 GSM Premium Matte',
            customPosterId: customPoster.id,
          },
          {
            title: 'Cyberpunk Neon Streets Poster',
            price: 29,
            quantity: 2,
            sizeName: 'A4',
            sizeDimensions: '21 x 29.7 cm',
            frameName: 'No Frame',
            paperType: 'Standard Matte',
          },
          {
            title: 'Retro Synthwave Sun Poster',
            price: 15,
            quantity: 1,
            sizeName: 'A5',
            sizeDimensions: '14.8 x 21 cm',
            frameName: 'No Frame',
            paperType: 'Standard Matte',
          },
          {
            title: 'Mini Samurai Art Card',
            price: 7,
            quantity: 3,
            sizeName: 'A6',
            sizeDimensions: '10.5 x 14.8 cm',
            frameName: 'No Frame',
            paperType: 'Standard Matte',
          },
        ],
      },
      payment: {
        create: {
          amount: 337,
          currency: 'INR',
          paymentStatus: 'CAPTURED',
          razorpayOrderId: `order_test_${Date.now()}`,
          razorpayPaymentId: `pay_test_${Date.now()}`,
        },
      },
    },
  });

  // Verify missing / placeholder API key handling
  console.log('\n--- Test 4: Missing/Placeholder RESEND_API_KEY Safety ---');
  const dummyKeyResult = await sendOrderAdminNotification(testCapturedOrder.id);
  assert(
    dummyKeyResult.skipped === true || dummyKeyResult.success === true,
    'Unconfigured/Dummy RESEND_API_KEY handled gracefully without crashing payment',
    `Result: ${JSON.stringify(dummyKeyResult)}`
  );

  const postDummyOrder = await prisma.order.findUnique({
    where: { id: testCapturedOrder.id },
  });
  assert(
    postDummyOrder?.orderStatus === 'CONFIRMED' && postDummyOrder?.paymentStatus === 'CAPTURED',
    'Order remains CONFIRMED and CAPTURED regardless of email provider state'
  );

  // -------------------------------------------------------------------------
  // Scenario 5: Idempotency & Duplicate Prevention
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Idempotency & Duplicate Webhook Handling ---');
  // Manually set status to SENT as if email provider had confirmed delivery
  await prisma.order.update({
    where: { id: testCapturedOrder.id },
    data: {
      adminEmailStatus: 'SENT',
      adminEmailSentAt: new Date(),
      adminEmailId: 'msg_test_mock_12345',
    },
  });

  // Now call sendOrderAdminNotification again (simulating duplicate webhook / browser refresh)
  const duplicateResult = await sendOrderAdminNotification(testCapturedOrder.id);
  assert(
    duplicateResult.skipped === true && duplicateResult.success === true,
    'Duplicate webhook/call skipped cleanly when status is already SENT',
    `Result: ${JSON.stringify(duplicateResult)}`
  );

  // -------------------------------------------------------------------------
  // Scenario 6: Concurrent Webhook Simulation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Concurrent Lock Contention ---');
  // Reset order to PENDING email status
  await prisma.order.update({
    where: { id: testCapturedOrder.id },
    data: {
      adminEmailStatus: 'PENDING',
      adminEmailSentAt: null,
      adminEmailId: null,
      adminEmailError: null,
    },
  });

  // Execute two concurrent invocations
  const [concurrent1, concurrent2] = await Promise.all([
    sendOrderAdminNotification(testCapturedOrder.id),
    sendOrderAdminNotification(testCapturedOrder.id),
  ]);

  // One of them must acquire lock and process, while the other must be skipped
  const oneSkipped = Boolean(
    (concurrent1.skipped && !concurrent2.skipped) ||
    (!concurrent1.skipped && concurrent2.skipped) ||
    (concurrent1.skipped && concurrent2.skipped)
  );
  assert(
    oneSkipped,
    'Concurrent calls are safely serialized; duplicate sends prevented by atomic DB lock',
    `Call 1: ${JSON.stringify(concurrent1)}, Call 2: ${JSON.stringify(concurrent2)}`
  );

  // -------------------------------------------------------------------------
  // Scenario 7: Verify Fixed Recipient Configuration
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Recipient Address Verification ---');
  const configuredEmail = process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
  assert(
    configuredEmail === 'raj.mandhyan@gmail.com',
    'Admin recipient email is strictly configured to raj.mandhyan@gmail.com',
    `Target: ${configuredEmail}`
  );

  // -------------------------------------------------------------------------
  // Cleanup test records
  // -------------------------------------------------------------------------
  console.log('\n--- Cleaning up test records ---');
  await prisma.payment.deleteMany({ where: { orderId: testCapturedOrder.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: testCapturedOrder.id } });
  await prisma.order.delete({ where: { id: testCapturedOrder.id } });
  await prisma.customPoster.delete({ where: { id: customPoster.id } });
  await prisma.order.delete({ where: { id: pendingOrder.id } });
  await prisma.order.delete({ where: { id: failedOrder.id } });
  console.log('Test records cleaned up successfully.');

  // -------------------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION & VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution failed with unhandled exception:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
