import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface SelectedContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
}

interface ContactPickerProps {
  onContactSelected: (contact: SelectedContact) => void;
  onDismiss: () => void;
}

export function ContactPicker({ onContactSelected, onDismiss }: ContactPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Request permissions and load contacts
  React.useEffect(() => {
    (async () => {
      try {
        // Avoid import errors on web by using dynamic import
        const ContactsModule = await import('expo-contacts');
        const Contacts = (ContactsModule as any).default ?? ContactsModule;

        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          setPermissionGranted(true);
          setLoading(true);
          const loaded = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
          });
          setContacts(loaded.data);
          setLoading(false);
        } else {
          setPermissionGranted(false);
        }
      } catch (error) {
        console.error('Error requesting contacts permission:', error);
        setPermissionGranted(false);
      }
    })();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter((contact) =>
      contact.name?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

    // Web-only message
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>Contact Picker</Text>
          <Text style={styles.message}>Contact picker is available on phone only. Use the web version to manage KPIs directly.</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleContactPress = (contact: any) => {
    const phoneNumber =
      contact.phoneNumbers && contact.phoneNumbers.length > 0
        ? contact.phoneNumbers[0].number
        : undefined;
    const email =
      contact.emails && contact.emails.length > 0
        ? contact.emails[0].email
        : undefined;

    onContactSelected({
      id: contact.id,
      name: contact.name,
      phoneNumber,
      email,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a contact</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {permissionGranted === false && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Contacts permission not granted. Please enable it in settings.</Text>
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts match your search' : 'No contacts found'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.contactList}>
            {filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactRow}
                onPress={() => handleContactPress(contact)}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name || 'Unknown'}</Text>
                  {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                    <Text style={styles.contactDetail}>{contact.phoneNumbers[0].number}</Text>
                  )}
                  {contact.emails && contact.emails.length > 0 && (
                    <Text style={styles.contactDetail}>{contact.emails[0].email}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: '100%',
    maxHeight: '80%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#cbd5e1',
    padding: 16,
    textAlign: 'center',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    color: '#f8fafc',
    fontSize: 14,
  },
  contactList: {
    maxHeight: 300,
  },
  contactRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  contactInfo: {
    gap: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  contactDetail: {
    fontSize: 13,
    color: '#94a3b8',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  dismissButton: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
});
