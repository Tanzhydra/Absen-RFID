// ============================
// KONFIGURASI SUPABASE
// ============================
const supabaseUrl = 'https://wzwwlzsprqeneneuim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3dsenNwcnFlbm1uZW5ldWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mjc3NjMsImV4cCI6MjA3ODQwMzc2M30.fj5Cx3yhaIZgVX5hwm1bTjTvfI7gHOhMiJHUhvqmY5A';

// Pastikan SDK sudah dimuat sebelum dipakai
if (typeof window.supabase === 'undefined') {
  alert('Supabase SDK belum dimuat. Pastikan koneksi internet aktif.');
}

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById('tableBody');
const statusText = document.getElementById('statusText');

// ============================
// FUNGSI AMBIL DATA ABSENSI DENGAN JOIN (Auto-Refresh)
// ============================
async function fetchAttendance() {
  // Tampilkan pesan loading
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
  statusText.textContent = 'Memuat data dari server...';

  // Query: Mengambil data absensi, melakukan JOIN ke tabel 'mahasiswa'
  // dan memfilter/mengurutkan waktu_absen.
  const { data, error } = await supabaseClient
    .from('absen')
    // SELECT: Ambil uid_kartu, waktu_absen, dan kolom 'nama'/'nrp' dari tabel mahasiswa
    .select('uid_kartu, waktu_absen, mahasiswa(nama, nrp)') 
    .not('waktu_absen', 'is', null) // Filter: Hanya ambil yang waktu absennya TIDAK NULL (absensi sukses)
    .order('waktu_absen', { ascending: false }); // Urutkan dari yang terbaru

  if (error) {
    console.error('Error:', error);
    statusText.textContent = '❌ Gagal memuat data. Periksa RLS atau relasi database.';
    tableBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Periksa izin RLS (anon key) atau relasi tabel.</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    statusText.textContent = 'Belum ada catatan absensi untuk sesi ini.';
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada catatan absen.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  statusText.textContent = `Total catatan: ${data.length} absen (Live)`;

  let no = 1;
  data.forEach((row) => {
    // Penanganan relasi (Supabase mengembalikan relasi Many-to-One langsung)
    const mahasiswaData = row.mahasiswa;
    
    // Tentukan Nama dan NRP. Jika mahasiswaData null (UID tidak terdaftar), tampilkan TIDAK TERDAFTAR.
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
// INITIALIZATION
// ============================

// Jalankan otomatis saat halaman dimuat
fetchAttendance();

// --- PENTING: FITUR AUTO-REFRESH ---
// Refresh data setiap 5 detik agar data yang masuk dari ESP32 segera terlihat
setInterval(fetchAttendance, 5000);
