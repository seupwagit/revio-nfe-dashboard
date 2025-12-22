# Sistema de Tratamento de Erros HTTP

Sistema completo de tratamento de erros HTTP com componentes de UI ricos usando Tailwind CSS.

## 🎯 Características

- **Notificações Toast**: Mensagens temporárias no canto da tela
- **Alertas Inline**: Componentes de alerta para uso em formulários e páginas
- **Modais de Erro**: Diálogos para erros críticos ou confirmações
- **Tratamento Automático**: Erros HTTP são tratados automaticamente
- **Mensagens Amigáveis**: Códigos de erro são convertidos em mensagens legíveis
- **Integração com Tailwind**: Design moderno e responsivo

## 🚀 Configuração Inicial

### 1. Envolver a aplicação com o NotificationProvider

```tsx
// App.tsx
import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorHandler } from './services/errorHandler';

function App() {
  return (
    <NotificationProvider position="top-right">
      <AppContent />
    </NotificationProvider>
  );
}

// Configurar o ErrorHandler
const AppContent = () => {
  const notify = useNotify();

  useEffect(() => {
    ErrorHandler.setNotifyFunction((type, message, options) => {
      notify[type](message, options);
    });
  }, [notify]);

  return <YourAppComponents />;
};
```

### 2. Importar estilos CSS (se necessário)

O sistema usa apenas classes Tailwind CSS, então certifique-se de que o Tailwind está configurado.

## 📱 Componentes Disponíveis

### Alertas Inline

```tsx
import { Alert, SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from './components/ui/Alert';

// Alerta genérico
<Alert
  type="success"
  title="Sucesso"
  message="Operação concluída!"
  onClose={() => console.log('Fechado')}
  actions={<button>Ação</button>}
/>

// Alertas específicos
<SuccessAlert message="Dados salvos com sucesso!" />
<ErrorAlert title="Erro" message="Falha na operação" />
<WarningAlert message="Atenção necessária" />
<InfoAlert message="Informação importante" />
```

### Toasts (Notificações)

```tsx
import { useNotify } from './contexts/NotificationContext';

const MyComponent = () => {
  const notify = useNotify();

  const handleAction = () => {
    // Notificações básicas
    notify.success('Sucesso!');
    notify.error('Erro!');
    notify.warning('Atenção!');
    notify.info('Informação');

    // Com opções
    notify.error('Erro crítico', {
      title: 'Falha no Sistema',
      persistent: true, // Não remove automaticamente
      duration: 10000   // 10 segundos
    });
  };

  return <button onClick={handleAction}>Testar</button>;
};
```

### Modais

```tsx
import { Modal, ErrorModal, SuccessModal } from './components/ui/Modal';

const [showModal, setShowModal] = useState(false);

<ErrorModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Erro Crítico"
  size="lg"
  actions={
    <div>
      <button onClick={() => setShowModal(false)}>Cancelar</button>
      <button onClick={handleRetry}>Tentar Novamente</button>
    </div>
  }
>
  <p>Detalhes do erro...</p>
</ErrorModal>
```

## 🌐 Requisições HTTP

### Tratamento Automático de Erros

```tsx
import { httpService } from './services/httpService';

// Erro tratado automaticamente
const response = await httpService.get('/api/users');
if (response.success) {
  console.log(response.data);
}
// Erros são exibidos automaticamente como toast

// Com contexto personalizado
const response = await httpService.post('/api/users', userData, {
  errorContext: 'Criação de usuário'
});
```

### Desabilitar Notificação Automática

```tsx
// Tratar erro manualmente
const response = await httpService.get('/api/data', {
  showErrorNotification: false
});

if (!response.success) {
  // Tratamento personalizado
  notify.error(`Erro personalizado: ${response.error}`);
}
```

### Upload e Download

```tsx
// Upload com feedback automático
const uploadResponse = await httpService.uploadFile('/api/upload', file, {}, {
  errorContext: 'Upload de documento'
});

// Download com feedback
const downloadResult = await httpService.downloadFile('/api/download/123', 'documento.pdf');
```

## 🎨 Personalização

### Adicionar Novos Tipos de Erro

```tsx
import { ErrorHandler } from './services/errorHandler';

// Registrar novo tipo de erro
ErrorHandler.registerErrorType('CUSTOM_ERROR', {
  code: 'CUSTOM_ERROR',
  title: 'Erro Personalizado',
  message: 'Mensagem personalizada para o usuário',
  type: 'error',
  showToast: true,
  persistent: false
});
```

### Posicionamento das Notificações

```tsx
<NotificationProvider position="bottom-left">
  {/* Opções: top-right, top-left, bottom-right, bottom-left */}
</NotificationProvider>
```

### Estilos Personalizados

```tsx
<Alert
  type="error"
  message="Erro"
  className="my-custom-class"
/>
```

## 🔧 Códigos de Erro Suportados

| Código | Título | Tipo | Descrição |
|--------|--------|------|-----------|
| `HTTP_401` | Sessão Expirada | warning | Token expirado |
| `HTTP_403` | Acesso Negado | error | Sem permissão |
| `HTTP_404` | Não Encontrado | error | Recurso não existe |
| `HTTP_500` | Erro do Servidor | error | Erro interno |
| `CONNECTION_ERROR` | Erro de Conexão | error | Falha de rede |
| `REQUEST_TIMEOUT` | Tempo Esgotado | warning | Timeout |
| `VALIDATION_ERROR` | Erro de Validação | error | Dados inválidos |
| `UPLOAD_ERROR` | Erro no Upload | error | Falha no envio |

## 📋 Exemplos Práticos

### Hook Personalizado

```tsx
export const useApiWithNotifications = () => {
  const notify = useNotify();

  const fetchUsers = async () => {
    const response = await httpService.get('/api/users', {
      errorContext: 'Carregamento de usuários'
    });

    if (response.success) {
      notify.success('Usuários carregados!');
      return response.data;
    }
    return null;
  };

  return { fetchUsers };
};
```

### Formulário com Validação

```tsx
const UserForm = () => {
  const notify = useNotify();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (data: UserData) => {
    const response = await httpService.post('/api/users', data, {
      errorContext: 'Criação de usuário'
    });

    if (response.success) {
      notify.success('Usuário criado com sucesso!');
      setErrors({});
    } else if (response.code === 'VALIDATION_ERROR') {
      // Tratar erros de validação específicos
      setErrors(response.data?.errors || {});
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.name && (
        <ErrorAlert message={errors.name.join(', ')} />
      )}
      {/* campos do formulário */}
    </form>
  );
};
```

## 🎯 Melhores Práticas

1. **Use contexto apropriado**: Sempre forneça `errorContext` nas requisições
2. **Notificações persistentes**: Use para erros críticos que precisam de ação
3. **Validação de formulários**: Combine alertas inline com toasts
4. **Feedback de sucesso**: Confirme ações importantes com notificações
5. **Modais para confirmação**: Use para ações destrutivas ou críticas

## 🔍 Debugging

Para debugar o sistema de notificações:

```tsx
// Verificar notificações ativas
const { notifications } = useNotifications();
console.log('Notificações ativas:', notifications);

// Limpar todas as notificações
const notify = useNotify();
notify.clearAll();
```