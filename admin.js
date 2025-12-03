// ============================
// KONFIGURASI SUPABASE
// ============================
const supabaseUrl = 'https://wzwwlzsprqenmneneuim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3dsenNwcnFlbm1uZW5ldWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mjc3NjMsImV4cCI6MjA3ODQwMzc2M30.fj5Cx3yhaIZgVX5hwm1bTjTvfI7gHOhMiJHUhvqmY5A';

// Pastikan SDK sudah dimuat sebelum dipakai
if (typeof window.supabase === 'undefined') {
  alert('Supabase SDK belum dimuat. Pastikan koneksi internet aktif.');
}

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById('tableBody');
const statusText = document.getElementById('statusText');

// ============================
// FUNGSI UTAMA AMBIL DATA ABSENSI
// ============================
async function fetchAttendance() {
  // Hanya tampilkan loading jika tabel kosong
  if (tableBody.innerHTML === '' || tableBody.innerHTML.includes('Memuat data')) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
  }
  statusText.textContent = 'Menghubungkan ke Realtime...';

  // Query: Mengambil data absensi, melakukan JOIN ke tabel 'mahasiswa'
  const { data, error } = await supabaseClient
    .from('absen')
    .select('uid_kartu, waktu_absen, mahasiswa(nama, nrp)') 
    .not('waktu_absen', 'is', null) // Filter: Hanya ambil yang waktu absennya TIDAK NULL
    .order('waktu_absen', { ascending: false }); // Urutkan dari yang terbaru

  if (error) {
    console.error('Error:', error);
    statusText.textContent = '❌ Gagal memuat data. Periksa RLS atau koneksi.';
    tableBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Periksa izin RLS (anon key) atau relasi tabel.</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    statusText.textContent = 'Belum ada catatan absensi untuk sesi ini.';
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada catatan absen.</td></tr>';
    return;
  }

  // UPDATE TABEL
  tableBody.innerHTML = '';
  statusText.textContent = `Total catatan: ${data.length} absen (Real-Time)`;

  let no = 1;
  data.forEach((row) => {
    const mahasiswaData = row.mahasiswa;
    const nama = mahasiswaData ? `${mahasiswaData.nama} (${mahasiswaData.nrp})` : 'TIDAK TERDAFTAR';
    
    const tr = document.createElement('tr');
    
    // Format waktu menjadi lokal Indonesia (menggunakan waktu WIB yang sudah dikoreksi Supabase)
    const waktu = new Date(row.waktu_absen).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    tr.innerHTML = `
      <td>${no++}</td>
      <td>${nama}</td> 
      <td>${row.uid_kartu}</td>
      <td>${waktu}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// ============================
// FUNGSI REALTIME LISTENER (WebSockets)
// ============================
function setupRealtimeListener() {
    // Subscribe ke channel 'absen_changes'
    supabaseClient
        .channel('absen_changes')
        .on(
            'postgres_changes',
            // Mendengarkan SEMUA event (*), di schema 'public', pada tabel 'absen'
            { event: '*', schema: 'public', table: 'absen' },
            (payload) => {
                console.log('Perubahan Realtime Diterima!', payload.eventType);
                // Ketika ada INSERT (absensi baru) atau DELETE (reset data), panggil fetchAttendance
                fetchAttendance(); 
            }
        )
        .subscribe();
    
    console.log("Realtime Listener aktif dan mendengarkan perubahan pada tabel 'absen'.");
}


// ============================
// INITIALIZATION
// ============================

// 1. Ambil data awal saat halaman dimuat
fetchAttendance();

// 2. Setup Realtime Listener untuk update instan
setupRealtimeListener();

// Note: Tidak menggunakan setInterval lagi karena Realtime sudah menangani update instan.
