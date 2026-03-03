const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.listAdmins = onCall(async (request) => {
    // Verifica se quem está chamando está autenticado
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Apenas usuários autenticados podem listar administradores.");
    }

    try {
        const listUsersResult = await admin.auth().listUsers(1000); // Traz até 1000 usuários
        const admins = listUsersResult.users.map((userRecord) => ({
            uid: userRecord.uid,
            email: userRecord.email,
        }));

        return { admins };
    } catch (error) {
        console.error("Erro ao listar administradores:", error);
        throw new HttpsError("internal", "Erro ao listar administradores.");
    }
});

exports.createAdmin = onCall(async (request) => {
    // Verifica se quem está chamando está autenticado
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Apenas usuários autenticados podem criar administradores.");
    }

    const { email, password } = request.data;

    if (!email || !password) {
        throw new HttpsError("invalid-argument", "Email e senha são obrigatórios.");
    }

    if (password.length < 6) {
        throw new HttpsError("invalid-argument", "A senha deve ter pelo menos 6 caracteres.");
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        return {
            message: "Administrador criado com sucesso.",
            uid: userRecord.uid
        };
    } catch (error) {
        console.error("Erro ao criar administrador:", error);

        if (error.code === 'auth/email-already-exists') {
             throw new HttpsError("already-exists", "O email fornecido já está em uso por outro usuário.");
        }
        if (error.code === 'auth/invalid-email') {
             throw new HttpsError("invalid-argument", "O email fornecido é inválido.");
        }

        throw new HttpsError("internal", "Erro ao criar administrador.");
    }
});

exports.deleteAdmin = onCall(async (request) => {
    // Verifica se quem está chamando está autenticado
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Apenas usuários autenticados podem excluir administradores.");
    }

    const { uid } = request.data;

    if (!uid) {
        throw new HttpsError("invalid-argument", "O UID do administrador é obrigatório.");
    }

    // Opcional: Impedir que o usuário exclua a si mesmo
    if (request.auth.uid === uid) {
        throw new HttpsError("permission-denied", "Você não pode excluir a si mesmo.");
    }

    try {
        await admin.auth().deleteUser(uid);
        return { message: "Administrador excluído com sucesso." };
    } catch (error) {
        console.error("Erro ao excluir administrador:", error);
        throw new HttpsError("internal", "Erro ao excluir administrador.");
    }
});
