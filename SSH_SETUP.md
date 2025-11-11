# 🔐 SSH Root Login Beállítása

## Automatikus módszer (ajánlott)

### 1. Script futtatása

```bash
su -
cd /path/to/korona-lspd
chmod +x enable-ssh-root.sh
./enable-ssh-root.sh
```

Ez automatikusan:
- ✅ Telepíti az SSH szervert (ha nincs)
- ✅ Engedélyezi a root belépést
- ✅ Újraindítja az SSH szolgáltatást
- ✅ Mutatja a kapcsolódási infókat

---

## Manuális módszer

### 1. SSH szerver telepítése

```bash
su -
apt-get update
apt-get install -y openssh-server
```

### 2. SSH konfiguráció szerkesztése

```bash
nano /etc/ssh/sshd_config
```

Keresd meg és módosítsd ezeket a sorokat:

```
PermitRootLogin yes
PasswordAuthentication yes
```

Ha a sor elején `#` van, töröld ki (uncomment).

**Mentés:** `Ctrl+X`, majd `Y`, majd `Enter`

### 3. Root jelszó beállítása (ha nincs)

```bash
passwd root
```

Adj meg egy erős jelszót!

### 4. SSH szolgáltatás újraindítása

```bash
systemctl restart sshd
# vagy
systemctl restart ssh
```

### 5. SSH engedélyezése bootkor

```bash
systemctl enable ssh
```

### 6. Firewall beállítása (ha van)

```bash
# UFW esetén
ufw allow 22/tcp
ufw reload

# iptables esetén
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

---

## Kapcsolódás

### SSH parancs

```bash
ssh root@SERVER_IP
```

Példa:
```bash
ssh root@192.168.1.100
```

### Első kapcsolódáskor

```
The authenticity of host '192.168.1.100' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Írj `yes`-t és nyomj Enter-t.

---

## Biztonsági javaslatok

### 1. Erős jelszó használata

```bash
# Legalább 16 karakter, kis/nagybetű, szám, speciális karakterek
passwd root
```

### 2. SSH kulcs használata (AJÁNLOTT!)

**A) Kulcspár generálása (lokális gépen):**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**B) Publikus kulcs másolása szerverre:**
```bash
ssh-copy-id root@SERVER_IP
```

**C) Jelszavas belépés tiltása (csak kulcs):**
```bash
# Szerveren:
nano /etc/ssh/sshd_config

# Változtasd:
PasswordAuthentication no

# Újraindítás:
systemctl restart sshd
```

### 3. SSH port változtatása

```bash
nano /etc/ssh/sshd_config

# Változtasd:
Port 2222  # vagy bármilyen más port (1024-65535)

# Újraindítás:
systemctl restart sshd

# Kapcsolódás:
ssh -p 2222 root@SERVER_IP
```

### 4. Fail2ban telepítése (brute-force védelem)

```bash
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 5. Csak bizonyos IP-k engedélyezése

```bash
nano /etc/ssh/sshd_config

# Add hozzá:
AllowUsers root@192.168.1.* root@10.0.0.*

# Újraindítás:
systemctl restart sshd
```

---

## Hibaelhárítás

### "Connection refused"

```bash
# Ellenőrizd, hogy fut-e az SSH
systemctl status sshd

# Ha nem fut, indítsd el:
systemctl start sshd
```

### "Permission denied"

```bash
# Ellenőrizd a root jelszót:
passwd root

# Ellenőrizd a konfigot:
grep PermitRootLogin /etc/ssh/sshd_config
# Kimenet: PermitRootLogin yes
```

### "Port already in use"

```bash
# Nézd meg, mi használja a 22-es portot:
netstat -tulpn | grep :22

# Vagy:
ss -tulpn | grep :22
```

### Firewall blokkolja

```bash
# UFW esetén:
ufw status
ufw allow 22/tcp

# iptables esetén:
iptables -L INPUT -n | grep 22
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

---

## SSH konfiguráció tesztelése

```bash
# Konfiguráció ellenőrzése (ne indítsd újra):
sshd -t

# Ha OK, akkor:
# (no output = minden rendben)

# Ha hiba van, javítsd és futtasd újra:
sshd -t
```

---

## Hasznos parancsok

```bash
# SSH státusz
systemctl status sshd

# SSH log-ok
tail -f /var/log/auth.log

# Aktív SSH kapcsolatok
who
w

# SSH szolgáltatás újraindítása
systemctl restart sshd

# SSH konfiguráció backup
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Eredeti konfig visszaállítása
cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
systemctl restart sshd
```

---

## Windows-ról történő kapcsolódás

### PuTTY használata

1. Töltsd le: https://www.putty.org/
2. Indítsd el PuTTY-t
3. **Host Name:** `root@SERVER_IP`
4. **Port:** `22`
5. **Connection type:** `SSH`
6. Klikk **Open**
7. Írd be a jelszót

### Windows 10+ beépített SSH

```cmd
ssh root@SERVER_IP
```

---

## macOS / Linux-ról történő kapcsolódás

```bash
ssh root@SERVER_IP
```

---

## ⚠️ FONTOS BIZTONSÁGI FIGYELMEZTETÉS

**Root SSH belépés KOCKÁZATOS!**

Ajánlott helyette:
1. Normál user létrehozása
2. SSH kulcs használata
3. `sudo` használata root helyett
4. Root SSH tiltása
5. Fail2ban telepítése

**Példa biztonságosabb konfig:**

```bash
# Normál user létrehozása
adduser mate
usermod -aG sudo mate

# SSH kulcs telepítése
su - mate
ssh-keygen
exit

# SSH konfig (biztonságos)
nano /etc/ssh/sshd_config

PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222

# Újraindítás
systemctl restart sshd
```

---

## Gyors referencia

| Parancs | Leírás |
|---------|--------|
| `ssh root@IP` | Kapcsolódás |
| `systemctl status sshd` | SSH státusz |
| `systemctl restart sshd` | SSH újraindítás |
| `nano /etc/ssh/sshd_config` | Konfig szerkesztése |
| `tail -f /var/log/auth.log` | Log-ok |
| `passwd root` | Root jelszó változtatás |
| `ssh-keygen` | SSH kulcs generálás |
| `ssh-copy-id root@IP` | Kulcs másolása |
| `ufw allow 22/tcp` | Firewall engedély |

---

## Sikeres SSH beállítás ellenőrzése

```bash
# Szerveren:
systemctl status sshd
# Kimenet: active (running)

# Lokális gépről:
ssh root@SERVER_IP
# Sikeresen bejelentkeztél!
```

✅ **Kész! Most már SSH-val be tudsz jelentkezni root-ként!**
