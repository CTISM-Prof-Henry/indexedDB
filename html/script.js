class DataHandler {
    constructor() {
        this.db = null;
        this.ready = false;

        const request = indexedDB.open("MyDatabase", 1);

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.ready = true;
            console.log("Banco de dados pronto!");
        };

        request.onerror = (event) => {
            alert("Não foi possível abrir o banco de dados!\n" + event.target.errorCode);
            this.ready = false;
        };

        // caso a versão do banco de dados seja diferente da armazenada no computador local
        request.onupgradeneeded = (event) => {
            this.db = event.target.result;

            let objectStore = this.db.createObjectStore(
                "pessoas", {
                    keyPath: "cpf"  // usa cpf como chave
                }
            );

            // cria um índice para facilitar a busca das pessoas por nome
            // esse valor pode ser repetido (várias pessoas podem ter o mesmo nome),
            // portanto ele não é único (unique)
            objectStore.createIndex(
                "nome", "nome", { unique: false }
            );

            // cria um índice para facilitar a busca das pessoas por idade
            // esse valor pode ser repetido (várias pessoas podem ter a mesma naturalidade),
            // portanto ele não é único (unique)
            objectStore.createIndex(
                "naturalidade", "naturalidade", { unique: false }
            );
            console.log("Atualização do banco de dados pronta!");
        };

        if(this.db !== null) {
            this.db.onerror = (event) => {
                console.error(`Erro de DB\n: ${event.target.error?.message}`);
            };
        }
    }

    isReady() {
        return this.ready && this.db;
    }

    saveItem(pessoa, callback) {
        if (!this.isReady()) {
            callback("Banco de dados não está pronto");
            return;
        }

        const transaction = this.db.transaction("pessoas", "readwrite");
        const objectStore = transaction.objectStore("pessoas");

        const request = objectStore.add(pessoa);

        request.onsuccess = () => {
            let message = `Pessoa com CPF ` + pessoa['cpf'] + ' salva!';
            console.log(message);
            callback(message)
        };
        request.onerror = (event) => {
            let message = null;
            if(request.result === undefined) {
                message = 'Não é possível salvar uma pessoa que já existe no banco de dados!';
            } else {
                message = `Erro ao salvar pessoa: ${event.target.message}`;
            }
            console.log(message);
            callback(message)
        };
    }

    loadItem(cpf, callback) {
        if (!this.isReady()) {
            return;
        }

        const transaction = this.db.transaction(["pessoas"]);
        const objectStore = transaction.objectStore("pessoas");
        const request = objectStore.get(cpf);

        request.onerror = (event) => {
            let message = `Erro ao recuperar pessoa: ${event.target.message}`;
            console.log(message);
            callback(message)
        }

        request.onsuccess = ((event) => {
            let message = null;
            if(request.result === undefined) {
                message = 'A pessoa com o CPF especificado não existe no banco de dados!';
            } else {
                message = 'CPF: ' + request.result.cpf;
                message += `\nNome: ${request.result.nome}`;
                message += `\nNaturalidade: ${request.result.naturalidade}`;
            }
            console.log(message);
            callback(message)
        });
    }

    removeItem(cpf, callback) {
        if (!this.isReady()) return;

        const request = this.db
            .transaction("pessoas", "readwrite")
            .objectStore("pessoas")
            .delete(cpf);
        request.onsuccess = (event) => {
            let message = 'pessoa com CPF ' + cpf + ' removida da base de dados!';
            console.log(message);
            callback(message);
        };
        request.onerror = (event) => {
            console.error(`Erro ao remover pessoa: ${event.target.message}`);
        };
    }

    loadAll(callback) {
        if (!this.isReady()) {
            return;
        }

        const transaction = this.db.transaction(["pessoas"], "readonly");
        const objectStore = transaction.objectStore("pessoas");
        const request = objectStore.getAll();

        request.onerror = (event) => {
            let message = "Erro ao recuperar dados: ${event.target.message}";
            console.error(message);
            callback(message);
        };

        request.onsuccess = (event) => {
            const results = request.result;
            callback(JSON.stringify(results, null, 2));
        };
    }
}