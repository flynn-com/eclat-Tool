import customtkinter as ctk
from PIL import Image, ImageTk

# ==============================
# Globale Variablen für Bonus
# ==============================
bonus_wert = 0  # Gesamtbonus
bonus_person = ""  # Person, die den Bonus bekommt

# ==============================
# Startfenster-Funktion
# ==============================
def start_startfenster():
    fenster = ctk.CTk()
    fenster.title("Startseite")
    fenster.geometry("640x480")
    fenster.configure(fg_color="#003544")

    große_font = ("Arial", 18, "bold")
    normale_font = ("Arial", 14)

    # Logo
    bild_dateipfad = "E:\Eclat-Daten\Eclat-Branding\Logos\Logo für website.png"
    try:
        bild = Image.open(bild_dateipfad)
        bild.thumbnail((180, 180))
        logo_img = ImageTk.PhotoImage(bild)
        logo_label = ctk.CTkLabel(fenster, image=logo_img, text="", fg_color="transparent")
        logo_label.pack(pady=(30, 10))
    except Exception as e:
        print("⚠️ Logo konnte nicht geladen werden:", e)

    titel_label = ctk.CTkLabel(
        fenster,
        text="Rechner wählen:",
        font=große_font,
        text_color="white",
        fg_color="transparent"
    )
    titel_label.pack(pady=(10, 30))

    # Buttons
    button_bonus = ctk.CTkButton(
        fenster,
        text="Vertriebsbonus-Rechner",
        font=normale_font,
        width=300,
        height=50,
        corner_radius=20,
        fg_color="#ffffff",
        text_color="#003544",
        hover_color="#bbdef0",
        command=lambda: [fenster.destroy(), start_vertriebsbonus()]
    )
    button_bonus.pack(pady=(10, 20))

    button_gewinn = ctk.CTkButton(
        fenster,
        text="Gewinnverteilungs-Rechner",
        font=normale_font,
        width=300,
        height=50,
        corner_radius=20,
        fg_color="#ffffff",
        text_color="#003544",
        hover_color="#bbdef0",
        command=lambda: [fenster.destroy(), start_gewinnverteilung()]
    )
    button_gewinn.pack(pady=(0, 20))
    
    button_gewinn = ctk.CTkButton(
        fenster,
        text="Projekt-Rechner",
        font=normale_font,
        width=300,
        height=50,
        corner_radius=10,
        fg_color="#ffffff",
        text_color="#003544",
        hover_color="#bbdef0",
        command=lambda: [fenster.destroy(), start_gewinnverteilung()]
    )
    button_gewinn.pack(pady=(0, 20))

    fenster.mainloop()


# ==============================
# Vertriebsbonus-Fenster
# ==============================
def start_vertriebsbonus():
    global bonus_wert, bonus_person

    bonus_fenster = ctk.CTk()
    bonus_fenster.title("Vertriebsbonus-Rechner")
    bonus_fenster.geometry("640x720")
    bonus_fenster.configure(fg_color="#003544")

    große_font = ("Arial", 18, "bold")
    normale_font = ("Arial", 14)

    # Logo
    bild_dateipfad = "H:\\Eclat-Daten\\Eclat-Branding\\Logos\\Logo für website.png"
    try:
        bild = Image.open(bild_dateipfad)
        bild.thumbnail((180, 180))
        logo_img = ImageTk.PhotoImage(bild)
        logo_label = ctk.CTkLabel(bonus_fenster, image=logo_img, text="", fg_color="transparent")
        logo_label.pack(pady=(15, 15))
    except Exception as e:
        print("⚠️ Logo konnte nicht geladen werden:", e)

    # Überschrift
    app_titel = ctk.CTkLabel(
        bonus_fenster,
        text="Vertriebsbonus-Rechner",
        font=große_font,
        text_color="white",
        fg_color="transparent"
    )
    app_titel.pack(pady=(0, 20))

    # Personenauswahl
    personen = ["Flynn", "Julius", "Paul"]
    personen_var = ctk.StringVar(value=personen[0])

    label_person = ctk.CTkLabel(
        bonus_fenster, text="Person auswählen:",
        font=normale_font,
        text_color="white",
        fg_color="transparent"
    )
    label_person.pack()

    dropdown = ctk.CTkOptionMenu(
        bonus_fenster,
        variable=personen_var,
        values=personen,
        width=220,
        height=40,
        corner_radius=15,
        fg_color="white",
        text_color="#003544",
        font=normale_font,
        button_color="#bbdef0",
        button_hover_color="#99cde6",
        dropdown_fg_color="white",
        dropdown_text_color="#003544"
    )
    dropdown._text_label.configure(anchor="center")
    dropdown.pack(pady=(0, 20))

    # Umsatz-Eingabe
    umsatz_var = ctk.StringVar()
    label_umsatz = ctk.CTkLabel(
        bonus_fenster,
        text="Umsatz in Euro (max. 200.000):",
        font=normale_font,
        text_color="white",
        fg_color="transparent"
    )
    label_umsatz.pack()

    umsatz_feld = ctk.CTkEntry(
        bonus_fenster,
        textvariable=umsatz_var,
        font=normale_font,
        width=240,
        height=40,
        corner_radius=15,
        fg_color="white",
        text_color="#003544",
        border_color="#bbdef0",
        border_width=2
    )
    umsatz_feld.pack(pady=(0, 20))

    # Berechnung
    def berechne_bonus(umsatz):
        bonus = 0
        details = []
        staffeln = [
            (0, 8000, 0.05),
            (8000, 20000, 0.03),
            (20000, 50000, 0.02),
            (50000, 200000, 0.01)
        ]
        rest = umsatz
        for start, ende, proz in staffeln:
            betrag = min(max(rest - start, 0), ende - start)
            if betrag > 0:
                anteil = betrag * proz
                bonus += anteil
                details.append(f"({betrag:,.2f} € × {proz*100:.0f} %) = {anteil:,.2f} €")
        return bonus, details

    def anzeigen():
        global bonus_wert, bonus_person
        person = personen_var.get()
        bonus_person = person  # Speichert die Person, die den Bonus bekommt
        umsatz = umsatz_var.get()
        ergebnis_label.configure(text="")
        details_box.configure(state="normal")
        details_box.delete("1.0", "end")
        try:
            umsatz_float = float(umsatz)
            if umsatz_float < 0 or umsatz_float > 200000:
                raise ValueError
            bonus, details = berechne_bonus(umsatz_float)
            bonus_wert = bonus
            ergebnis_label.configure(
                text=f"👤 Person: {person}\n💶 Umsatz: {umsatz_float:,.2f} €\n💰 Bonus: {bonus:,.2f} €"
            )
            for zeile in details:
                details_box.insert("end", zeile + "\n")
            details_box.configure(state="disabled")
        except ValueError:
            ergebnis_label.configure(text="⚠️ Bitte gültigen Umsatz (0–200.000) eingeben.")
            details_box.configure(state="disabled")

    # Button Berechnen
    button = ctk.CTkButton(
        bonus_fenster,
        text="Bonus berechnen",
        font=normale_font,
        width=240,
        height=45,
        corner_radius=20,
        fg_color="#ffffff",
        text_color="#003544",
        hover_color="#bbdef0",
        command=anzeigen
    )
    button.pack(pady=(5, 10))

    # Zurück-Button
    button_zurueck = ctk.CTkButton(
        bonus_fenster,
        text="Zurück",
        font=normale_font,
        width=120,
        height=40,
        corner_radius=15,
        fg_color="#ffffff",
        text_color="#003544",
        hover_color="#bbdef0",
        command=lambda: [bonus_fenster.destroy(), start_startfenster()]
    )
    button_zurueck.pack(pady=(0, 20))

    # Ergebnisanzeige
    ergebnis_label = ctk.CTkLabel(
        bonus_fenster,
        text="",
        font=normale_font,
        text_color="white",
        justify="left",
        fg_color="transparent"
    )
    ergebnis_label.pack(pady=(10, 10))

    # Details-Textbox
    details_box = ctk.CTkTextbox(
        bonus_fenster,
        height=160,
        width=520,
        font=("Consolas", 12),
        corner_radius=15,
        fg_color="#e1f5fe",
        text_color="#003544",
        state="disabled"
    )
    details_box.pack(pady=(0, 20))

    bonus_fenster.mainloop()


# ==============================
# Gewinnverteilungs-Fenster
# ==============================
def start_gewinnverteilung():
    global bonus_wert, bonus_person

    fenster = ctk.CTk()
    fenster.title("Gewinnverteilungs-Rechner")
    fenster.geometry("640x800")
    fenster.configure(fg_color="#003544")

    große_font = ("Arial", 18, "bold")
    normale_font = ("Arial", 14)

    # Logo
    bild_dateipfad = "H:\\Eclat-Daten\\Eclat-Branding\\Logos\\Logo für website.png"
    try:
        bild = Image.open(bild_dateipfad)
        bild.thumbnail((180, 180))
        logo_img = ImageTk.PhotoImage(bild)
        logo_label = ctk.CTkLabel(fenster, image=logo_img, text="", fg_color="transparent")
        logo_label.pack(pady=(15, 15))
    except Exception as e:
        print("⚠️ Logo konnte nicht geladen werden:", e)

    # Überschrift
    titel_label = ctk.CTkLabel(
        fenster,
        text="Gewinnverteilungs-Rechner",
        font=große_font,
        text_color="white",
        fg_color="transparent"
    )
    titel_label.pack(pady=(0, 20))

    # Gewinnfeld
    gewinn_var = ctk.StringVar()
    label_gewinn = ctk.CTkLabel(fenster, text="Gesamtgewinn (€):", font=normale_font, text_color="white", fg_color="transparent")
    label_gewinn.pack()
    gewinn_feld = ctk.CTkEntry(fenster, textvariable=gewinn_var, font=normale_font, width=240, height=40,
                               corner_radius=15, fg_color="white", text_color="#003544", border_color="#bbdef0", border_width=2)
    gewinn_feld.pack(pady=(0,15))

    # Gewinn nach Abzug des Bonus
    gewinn_nach_bonus_var = ctk.StringVar()
    label_gewinn_nach_bonus = ctk.CTkLabel(fenster, text="Gewinn nach Abzug des Bonus (€):", font=normale_font, text_color="white", fg_color="transparent")
    label_gewinn_nach_bonus.pack()
    gewinn_nach_bonus_feld = ctk.CTkEntry(fenster, textvariable=gewinn_nach_bonus_var, font=normale_font, width=240, height=40,
                                          corner_radius=15, fg_color="white", text_color="#003544", border_color="#bbdef0", border_width=2)
    gewinn_nach_bonus_feld.pack(pady=(0,20))

    # Stundenfelder
    stunden_vars = [ctk.StringVar(value="0"), ctk.StringVar(value="0"), ctk.StringVar(value="0")]
    personen = ["Julius", "Paul", "Flynn"]
    for i, p in enumerate(personen):
        label = ctk.CTkLabel(fenster, text=f"Arbeitsstunden {p}:", font=normale_font, text_color="white", fg_color="transparent")
        label.pack()
        entry = ctk.CTkEntry(fenster, textvariable=stunden_vars[i], font=normale_font, width=240, height=40,
                             corner_radius=15, fg_color="white", text_color="#003544", border_color="#bbdef0", border_width=2)
        entry.pack(pady=(0,15))

    ergebnis_label = ctk.CTkLabel(fenster, text="", font=normale_font, text_color="white", justify="left", fg_color="transparent")
    ergebnis_label.pack(pady=(10,10))

    # Berechnung
    def berechnen():
        try:
            gewinn = float(gewinn_var.get())
            gewinn_nach_bonus = gewinn - bonus_wert
            gewinn_nach_bonus_var.set(f"{gewinn_nach_bonus:.2f}")

            stunden = [float(v.get()) for v in stunden_vars]
            if any(s < 0 for s in stunden) or gewinn_nach_bonus < 0:
                raise ValueError

            anteil_gleich = (gewinn_nach_bonus * 0.3) / 3
            steuerruecklage = gewinn_nach_bonus * 0.3
            gesamt_stunden = sum(stunden)
            anteil_pro_stunde = (gewinn_nach_bonus * 0.4) / gesamt_stunden if gesamt_stunden > 0 else 0
            anteile_stunden = [s * anteil_pro_stunde for s in stunden]

            # Bonus nur auf die ausgewählte Person
            gesamt_anteile = []
            stundenlohn = []
            for i, p in enumerate(personen):
                total = anteil_gleich + anteile_stunden[i]
                if p == bonus_person:
                    total += bonus_wert
                gesamt_anteile.append(total)
                stundenlohn.append(anteile_stunden[i] / stunden[i] if stunden[i] > 0 else 0)

            # Ergebnisfenster
            ergebnis_fenster = ctk.CTkToplevel()
            ergebnis_fenster.title("Ergebnis Gewinnverteilung")
            ergebnis_fenster.geometry("600x550")
            ergebnis_fenster.configure(fg_color="#003544")

            label_title = ctk.CTkLabel(ergebnis_fenster, text="Gewinnverteilung Ergebnis", font=("Arial",25,"bold"), text_color="white")
            label_title.pack(pady=(15,15))

            text = ""
            for i, p in enumerate(personen):
                text += f"{p}:\n"
                text += f"  30% gleichmäßig: {anteil_gleich:,.2f} €\n"
                text += f"  Anteil nach Stunden ({stunden[i]} h): {anteile_stunden[i]:,.2f} €\n"
                if p == bonus_person:
                    text += f"  Bonus hinzugefügt: {bonus_wert:,.2f} €\n"
                text += f"  Stundenlohn: {stundenlohn[i]:,.2f} €/h\n"
                text += f"  Gesamt: {gesamt_anteile[i]:,.2f} €\n\n"
            text += f"Steuerrücklage (30%): {steuerruecklage:,.2f} €"

            ergebnis_box = ctk.CTkTextbox(ergebnis_fenster, width=560, height=450, corner_radius=15,
                                          font=("Consolas", 16), fg_color="#e1f5fe", text_color="#003544")
            ergebnis_box.pack(pady=(10,15))
            ergebnis_box.insert("0.0", text)
            ergebnis_box.configure(state="disabled")

        except ValueError:
            ergebnis_label.configure(text="⚠️ Bitte gültige Zahlen eingeben (≥ 0).")

    button = ctk.CTkButton(fenster, text="Gewinn verteilen", font=normale_font,
                           width=240, height=45, corner_radius=20,
                           fg_color="#ffffff", text_color="#003544", hover_color="#bbdef0",
                           command=berechnen)
    button.pack(pady=(10,20))

    fenster.mainloop()


# ==============================
# Start des Programms
# ==============================
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("blue")
start_startfenster()
