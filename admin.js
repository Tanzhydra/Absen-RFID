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
// FUNGSI AMBIL DATA ABSENSI DENGAN JOIN
// ============================
async function fetchAttendance() {
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
  statusText.textContent = 'Memuat data dari server...';

  // Query: Mengambil data dari 'absen' DAN melakukan JOIN ke 'mahasiswa'
  const { data, error } = await supabaseClient
    .from('absen')
    // Select: Ambil uid_kartu dan waktu_absen dari tabel absen,
    // serta nama dan nrp dari tabel 'mahasiswa' yang berelasi
    .select('uid_kartu, waktu_absen, mahasiswa(nama, nrp)') 
    .order('waktu_absen', { ascending: false });

  if (error) {
    console.error('Error:', error);
    statusText.textContent = '❌ Gagal memuat data. Periksa RLS atau relasi database.';
    tableBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Periksa izin RLS (anon key) atau relasi tabel.</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    statusText.textContent = 'Belum ada data absensi.';
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada catatan absen.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  statusText.textContent = `Total catatan: ${data.length} absen`;

  let no = 1;
  data.forEach((row) => {
    // Data Mahasiswa dari Relasi
    const mahasiswaData = row.mahasiswa;
    const nama = mahasiswaData ? `${mahasiswaData.nama} (${mahasiswaData.nrp})` : 'TIDAK TERDAFTAR';
    
    const tr = document.createElement('tr');
    
    // Format waktu menjadi lokal Indonesia
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

// Jalankan otomatis saat halaman dimuat
fetchAttendance();

// Opsional: refresh otomatis tiap 30 detik
// setInterval(fetchAttendance, 30000);