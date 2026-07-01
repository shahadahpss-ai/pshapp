import csv
import random
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

# Lists of Sabahan names
first_names_male_muslim = [
    "Mohd Azlan", "Ahmad Daniel", "Muhammad Syahmi", "Awangku Syazwan", "Mohd Firdaus",
    "Al-Hafiz", "Nuriman", "Mohd Syazwan", "Ahmad Fauzi", "Muhammad Ridzuan",
    "Mohd Khairul", "Ahmad Syakir", "Muhammad Haziq", "Mohd Shahrul", "Ahmad Zaki"
]

first_names_female_muslim = [
    "Dayang Nurul", "Siti Aishah", "Nurul Izzah", "Puteri Balqis", "Sharifah Aminah",
    "Farhana", "Siti Norhaliza", "Nur Syuhada", "Dayangku Salbiah", "Siti Hajar",
    "Nur Farah", "Siti Sarah", "Nurul Asyiqin", "Dayang Masniah", "Siti Aminah"
]

first_names_male_indigenous = [
    "Jolius", "Elvin", "Deondre", "Rayner", "Murphy", "Aldrin", "Jovian", "Arthur",
    "Oswald", "Brandon", "Maxwell", "Standly", "Ronaldo", "Desmond", "Giles",
    "Cornelius", "Freddy", "Alvin", "Darrel", "Carlson"
]

first_names_female_indigenous = [
    "Fiona", "Sherry", "Olivia", "Brenda", "Hazel", "Easter", "Jacquelyn", "Clarissa",
    "Michelle", "Christy", "Vanessa", "Debbie", "Melanie", "Stacy", "Evelyn",
    "Rachael", "Gwen", "Valerie", "Cynthia", "Ivonne"
]

first_names_male_chinese = [
    "Wong Jun Jie", "Lee Kah Seng", "Chan Wei Lun", "Lim Jia Lok", "Tan Ze Shen",
    "Chong Wei Jian", "Liew Tze Kent", "Yong Kah Chun", "Ng Wei Hong", "Chin Kok Wai"
]

first_names_female_chinese = [
    "Wong Qi Yi", "Lee Mei Ting", "Chan Xin Yi", "Lim Huey Yee", "Tan Siew Ling",
    "Chong Siew Ching", "Liew Yee Wen", "Yong Jia Xin", "Ng Mei Ling", "Chin Huey Min"
]

last_names_muslim = [
    "bin Awang", "bin Mohd", "bin Abdullah", "bin Sulaiman", "bin Ismail", 
    "bin Yusof", "bin Ibrahim", "bin Osman", "bin Hamid", "bin Rahman",
    "binti Awang", "binti Mohd", "binti Abdullah", "binti Sulaiman", "binti Ismail", 
    "binti Yusof", "binti Ibrahim", "binti Osman", "binti Hamid", "binti Rahman"
]

last_names_indigenous = [
    "Justin", "Gunting", "Mojikon", "Kurup", "Gimbang", "Kinsik", "Sedomon", "Marcus",
    "Andu", "Lasimbang", "Motinggo", "Dunging", "Ambrose", "Marius", "Dualis",
    "Gompil", "Tokuzip", "Katingan", "Ginsos", "Tulas"
]

# Sabah Address Parts
sabah_districts = [
    {"town": "Kota Kinabalu", "postcode": ["88000", "88100", "88200", "88300", "88400"], "streets": ["Jalan Tun Fuad Stephens", "Jalan Tuaran", "Jalan Lintas", "Jalan Coastal", "Jalan KK Bypass"]},
    {"town": "Penampang", "postcode": ["89500"], "streets": ["Jalan Penampang", "Jalan Donggongon", "Jalan Bundusan", "Jalan Kobusak"]},
    {"town": "Sandakan", "postcode": ["90000", "90700"], "streets": ["Jalan Labuk", "Jalan Leila", "Jalan Utara", "Jalan Sibuga"]},
    {"town": "Tawau", "postcode": ["91000", "91100"], "streets": ["Jalan Apas", "Jalan Kuhara", "Jalan Merotai", "Jalan Sin On"]},
    {"town": "Keningau", "postcode": ["89000"], "streets": ["Jalan Keningau - Tambunan", "Jalan Pegalan", "Jalan Tenom"]},
    {"town": "Semporna", "postcode": ["91300"], "streets": ["Jalan Pegagau", "Jalan Bubul", "Jalan Kabogan"]},
    {"town": "Papar", "postcode": ["89600"], "streets": ["Jalan Beaufort - Papar", "Jalan Pan Borneo", "Jalan Simpudu"]},
    {"town": "Tuaran", "postcode": ["89200"], "streets": ["Jalan Sulaman", "Jalan Berungis", "Jalan Ranau - Tuaran"]},
    {"town": "Ranau", "postcode": ["89300"], "streets": ["Jalan Kundasang", "Jalan Ranau Bypass", "Jalan Tamparuli"]},
    {"town": "Beaufort", "postcode": ["89800"], "streets": ["Jalan Gadong", "Jalan Kota Klias", "Jalan Padas"]},
    {"town": "Kota Belud", "postcode": ["89150"], "streets": ["Jalan Kudat", "Jalan Tempasuk", "Jalan Usukan"]}
]

kampung_names = ["Kampung Air", "Kampung Likas", "Kampung Kepayan", "Kampung Baru", "Kampung Baru Luyang", "Kampung Pasir Putih", "Kampung Penampang Proper", "Kampung Bunduon", "Kampung Kolopis"]
taman_names = ["Taman Jumbo", "Taman Indah", "Taman Megah", "Taman Sentosa", "Taman Hilltop", "Taman Seri Borneon", "Taman Vista", "Taman Seri Anggerik"]

def generate_random_birthdate():
    # Born between 2008 and 2018 (school-going ages 8 to 18 in 2026)
    start_date = datetime(2008, 1, 1)
    end_date = datetime(2018, 12, 31)
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_number_of_days)

def generate_sabah_ic(birth_date, gender):
    # Sabah State Codes: 12, 47, 48, 49
    state_code = random.choice(["12", "47", "48", "49"])
    
    yy = birth_date.strftime("%y")
    mm = birth_date.strftime("%m")
    dd = birth_date.strftime("%d")
    
    # 4 digits code: last digit is odd for Male, even for Female
    last_four = random.randint(100, 999) * 10
    if gender == "Lelaki":
        last_four += random.choice([1, 3, 5, 7, 9])
    else:
        last_four += random.choice([0, 2, 4, 6, 8])
        
    return f"{yy}{mm}{dd}{state_code}{last_four:04d}"

def generate_address():
    district = random.choice(sabah_districts)
    postcode = random.choice(district["postcode"])
    street = random.choice(district["streets"])
    town = district["town"]
    
    loc_type = random.choice(["Kampung", "Taman", "Flat/Lot"])
    if loc_type == "Kampung":
        address_line_1 = f"No. {random.randint(1, 150)}, {random.choice(kampung_names)}"
    elif loc_type == "Taman":
        address_line_1 = f"No. {random.randint(1, 100)}, {random.choice(taman_names)}"
    else:
        address_line_1 = f"Lot {random.randint(10, 200)}, Tingkat {random.randint(1, 4)}, Blok {random.choice(['A', 'B', 'C', 'D'])}"
        
    return f"{address_line_1}, {street}, {postcode} {town}, Sabah"

def generate_student():
    # 3 categories of name structures: Muslim (Malay/Bajau etc.), Indigenous (Kadazan-Dusun/Murut etc.), Chinese
    ethnicity = random.choice(["Muslim", "Indigenous", "Chinese"])
    gender = random.choice(["Lelaki", "Perempuan"])
    
    name = ""
    if ethnicity == "Muslim":
        if gender == "Lelaki":
            first = random.choice(first_names_male_muslim)
            last = random.choice([l for l in last_names_muslim if l.startswith("bin ")])
        else:
            first = random.choice(first_names_female_muslim)
            last = random.choice([l for l in last_names_muslim if l.startswith("binti ")])
        name = f"{first} {last}"
    elif ethnicity == "Indigenous":
        if gender == "Lelaki":
            first = random.choice(first_names_male_indigenous)
            last = "bin " + random.choice(last_names_indigenous)
        else:
            first = random.choice(first_names_female_indigenous)
            last = "binti " + random.choice(last_names_indigenous)
        name = f"{first} {last}"
    else: # Chinese
        if gender == "Lelaki":
            name = random.choice(first_names_male_chinese)
        else:
            name = random.choice(first_names_female_chinese)
            
    birth_date = generate_random_birthdate()
    ic_number = generate_sabah_ic(birth_date, gender)
    address = generate_address()
    
    return {
        "Nama": name,
        "No. Kad Pengenalan": ic_number,
        "Jantina": gender,
        "Alamat": address
    }

# Generate 50 students
students = []
for _ in range(50):
    students.append(generate_student())

# Write to CSV
csv_filename = "senarai_pelajar_sabah.csv"
with open(csv_filename, mode="w", newline="", encoding="utf-8") as file:
    fieldnames = ["Nama", "No. Kad Pengenalan", "Jantina", "Alamat"]
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    for s in students:
        writer.writerow(s)

print(f"Berjaya menjana {len(students)} data pelajar Sabah ke dalam file '{csv_filename}'.")
