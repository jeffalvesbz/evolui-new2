import React from 'react';
import { useModalStore } from '../stores/useModalStore';
import { Modal } from './ui/BaseModal';
import { BookCopyIcon, PlusIcon, SettingsIcon } from './icons';

const RegisterEditalModal: React.FC = () => {
    const {
        isRegisterEditalModalOpen,
        closeRegisterEditalModal,
        openDefaultEditalModal,
        openEditalModal,
    } = useModalStore();

    const handleUseDefault = () => {
        closeRegisterEditalModal();
        openDefaultEditalModal();
    };

    const handleManualRegistration = () => {
        closeRegisterEditalModal();
        openEditalModal('create');
    };

    const handleManageEditais = () => {
        closeRegisterEditalModal();
        openEditalModal('list');
    };

    return (
        <Modal
            isOpen={isRegisterEditalModalOpen}
            onClose={closeRegisterEditalModal}
            size="3xl"
        >
            <Modal.Header onClose={closeRegisterEditalModal}>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Editais</p>
                    <h2 className="text-2xl font-bold mt-1">O que você deseja fazer?</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Crie um novo edital, use um padrão ou gerencie seus editais existentes.
                    </p>
                </div>
            </Modal.Header>

            <Modal.Body>
                <div className="grid gap-4 md:grid-cols-3">
                    <button
                        onClick={handleUseDefault}
                        className="text-left bg-muted/80 border border-border rounded-2xl p-6 hover:border-primary/60 hover:bg-muted/90 transition flex flex-col gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                            <BookCopyIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold">Usar edital padrão</p>
                            <p className="text-sm text-muted-foreground">
                                Clone um edital pronto com disciplinas e cargas validadas por especialistas.
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-primary mt-auto">Ver lista de editais</span>
                    </button>

                    <button
                        onClick={handleManualRegistration}
                        className="text-left bg-muted/70 border border-dashed border-border rounded-2xl p-6 hover:border-primary/60 hover:bg-muted/85 transition flex flex-col gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold">Cadastrar manualmente</p>
                            <p className="text-sm text-muted-foreground">
                                Defina nome, banca, órgãos e cronograma para montar um edital personalizado.
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-secondary-foreground mt-auto">Abrir formulário</span>
                    </button>

                    <button
                        onClick={handleManageEditais}
                        className="text-left bg-muted/75 border border-border rounded-2xl p-6 hover:border-primary/60 hover:bg-muted/90 transition flex flex-col gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold">Gerenciar Editais</p>
                            <p className="text-sm text-muted-foreground">
                                Visualize, edite ou exclua seus editais existentes e gerencie seus planos de estudo.
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-primary mt-auto">Abrir gerenciador</span>
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default RegisterEditalModal;
