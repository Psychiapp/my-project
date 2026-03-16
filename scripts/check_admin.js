// Verify admin profile and test signed URL generation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('=== Step 1: Check Admin Profile ===');

  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('email', 'bianca@psychiapp.com')
    .single();

  if (adminError) {
    console.error('Error fetching admin profile:', adminError);
  } else {
    console.log('Admin profile:', JSON.stringify(adminProfile, null, 2));

    if (adminProfile.role !== 'admin') {
      console.log('\n⚠️  Role is NOT admin. Updating...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', 'bianca@psychiapp.com');

      if (updateError) {
        console.error('Error updating role:', updateError);
      } else {
        console.log('✅ Role updated to admin');
      }
    } else {
      console.log('✅ Role is already admin');
    }
  }

  console.log('\n=== Step 2: Find Supporters with Documents ===');

  const { data: supporters, error: suppError } = await supabase
    .from('supporter_details')
    .select('supporter_id, transcript_url, id_document_url, verification_status')
    .not('transcript_url', 'is', null)
    .limit(5);

  if (suppError) {
    console.error('Error fetching supporters:', suppError);
    return;
  }

  if (!supporters || supporters.length === 0) {
    console.log('No supporters with uploaded documents found.');

    // Check if anyone has id_document_url
    const { data: idDocs } = await supabase
      .from('supporter_details')
      .select('supporter_id, id_document_url')
      .not('id_document_url', 'is', null)
      .limit(3);

    if (idDocs && idDocs.length > 0) {
      console.log('Found supporters with ID documents:', idDocs);
    }
    return;
  }

  console.log('Found', supporters.length, 'supporters with transcripts:');
  supporters.forEach((s, i) => {
    console.log(`${i + 1}. ${s.supporter_id}`);
    console.log(`   transcript_url: ${s.transcript_url}`);
    console.log(`   id_document_url: ${s.id_document_url || 'null'}`);
  });

  // Test signed URL with first supporter
  const testSupporter = supporters[0];
  const filePath = testSupporter.transcript_url;

  console.log('\n=== Step 3: Test Signed URL Generation ===');
  console.log('File path from DB:', filePath);

  if (filePath.startsWith('http')) {
    console.log('⚠️  Value is already a full URL, not a storage path!');
    const pathMatch = filePath.match(/verification-documents\/(.+?)(\?|$)/);
    if (pathMatch) {
      console.log('Extracted path would be:', pathMatch[1]);
    }
    return;
  }

  // Generate signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(filePath, 3600);

  if (signedError) {
    console.error('❌ Signed URL Error:', signedError);

    // Debug: list what's in the bucket
    console.log('\nListing bucket contents...');
    const { data: folders } = await supabase.storage
      .from('verification-documents')
      .list('', { limit: 10 });

    console.log('Root folders:', folders?.map(f => f.name));

    // Try listing the transcripts folder
    const { data: transcripts } = await supabase.storage
      .from('verification-documents')
      .list('transcripts', { limit: 10 });

    console.log('transcripts/ contents:', transcripts?.map(f => f.name));
  } else {
    console.log('✅ Signed URL generated successfully!');
    console.log('URL (truncated):', signedData.signedUrl.substring(0, 120) + '...');
  }
}

main().catch(console.error);
