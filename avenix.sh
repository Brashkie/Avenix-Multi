#!/data/data/com.termux/files/usr/bin/bash
# Código desarrollado por @gata_dios

BOT_DIR="Avenix-Multi"
BOT_REPO="https://github.com/Brashkie/$BOT_DIR"
DB_FILE="storage/database/database.json"
DB_BACKUP="$HOME/avenix-database.json"

GREEN='\033[32m'
BOLD='\033[1m'
RESET='\033[0m'

say() { echo -e "${BOLD}${GREEN}$1${RESET}"; }

# Guarda la base de datos fuera del repo antes de re-clonar y la restaura después
backup_db() { [ -e "$DB_FILE" ] && say "Respaldando \"$DB_FILE\" en \"$DB_BACKUP\"..." && mv "$DB_FILE" "$DB_BACKUP"; }
restore_db() {
    if [ -e "$DB_BACKUP" ]; then
        say "Restaurando base de datos en \"$BOT_DIR/$DB_FILE\"."
        mkdir -p "$(dirname "$DB_FILE")"
        mv "$DB_BACKUP" "$DB_FILE"
    fi
}
install_deps() { npm install; }   # los scripts de instalación son necesarios (tsx, sharp, baileys)

fresh_clone() {
    cd "$HOME" || exit
    rm -rf "$BOT_DIR"
    git clone "$BOT_REPO"
    cd "$BOT_DIR" || exit
    install_deps
    restore_db
}

if [[ $(basename "$PWD") == "$BOT_DIR" ]]; then
    if [ -e "$DB_FILE" ]; then
        backup_db
        say "Clonando repositorio \"$BOT_REPO\" en \"$HOME\"..."
        fresh_clone
    else
        say "\"$DB_FILE\" no existe en \"$BOT_DIR\", iniciando el bot..."
    fi
else
    say "Ubicación actual: \"$PWD\""
    cd "$HOME" || exit
    if [ -d "$BOT_DIR" ]; then
        cd "$BOT_DIR" || exit
        if [ -e "$DB_FILE" ]; then
            backup_db
            say "Actualizando repositorio..."
            fresh_clone
        fi
    else
        say "\"$BOT_DIR\" no existe, clonando repositorio \"$BOT_REPO\" en \"$HOME\"..."
        fresh_clone
    fi
fi

say "Iniciando $BOT_DIR..."
npm start
