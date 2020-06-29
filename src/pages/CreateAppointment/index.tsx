import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Platform, Alert } from 'react-native';
import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  CalendarTitle,
  OpenDatePickerButton,
  OpenDatePickerButtonText,
  Schedule,
  ScheduleTitle,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  CreateAppointmentButton,
  CreateAppointmentButtonText,
  Content,
} from './styles';
import { useAuth } from '../../hooks/Auth';
import api from '../../services/api';

interface RouteParams {
  providerId: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface HourAvailabilityItem {
  hour: number;
  availability: boolean;
}

const CreateAppointment: React.FC = () => {
  const route = useRoute();
  const routeParams = route.params as RouteParams;
  const [providers, setProviders] = useState<Provider[]>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(0);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoursAvailability, setHoursAvailability] = useState<
    HourAvailabilityItem[]
  >([] as HourAvailabilityItem[]);

  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );
  const { user } = useAuth();

  const { goBack, navigate } = useNavigation();

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const handleDateChanged = useCallback(
    (event: any, date: Date | undefined) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }

      if (date) {
        setSelectedDate(date);
      }
    },
    [],
  );

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker((state) => !state);
  }, []);

  const natigateToBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate);
      date.setHours(selectedHour);
      date.setMinutes(0);

      await api.post('appointments', {
        provider_id: selectedProvider,
        date,
      });

      navigate('AppointmentCreated', { date: date.getTime() });
    } catch (err) {
      Alert.alert(
        'error ao criar agendamento ',
        'Ocorreu um erro ao criar o agendamento , tente novamente',
      );
    }
  }, [navigate, selectedDate, selectedHour, selectedProvider]);

  useEffect(() => {
    api
      .get(`providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      })
      .then((response) => {
        setHoursAvailability(response.data);
      });
  }, [selectedDate, selectedProvider]);

  useEffect(() => {
    api.get('providers').then((response) => {
      setProviders(response.data);
    });
  }, []);

  const morningAvailability = useMemo(() => {
    return hoursAvailability
      .filter(({ hour }) => hour < 12)
      .map(({ hour, availability }) => {
        return {
          hour,
          availability,
          hourFormatted: format(new Date().setHours(hour), 'HH:00'),
        };
      });
  }, [hoursAvailability]);

  const afternoonAvailability = useMemo(() => {
    return hoursAvailability
      .filter(({ hour }) => hour >= 12)
      .map(({ hour, availability }) => {
        return {
          hour,
          availability,
          hourFormatted: format(new Date().setHours(hour), 'HH:00'),
        };
      });
  }, [hoursAvailability]);

  return (
    <Container>
      <Header>
        <BackButton onPress={natigateToBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>Cabeleireiros</HeaderTitle>
        <UserAvatar source={{ uri: user.avatar_url }} />
      </Header>
      <Content>
        <ProvidersListContainer>
          <ProvidersList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={(provider) => provider.id}
            renderItem={({ item: provider }) => (
              <ProviderContainer
                onPress={() => handleSelectProvider(provider.id)}
                selected={provider.id === selectedProvider}
              >
                <ProviderAvatar
                  source={{
                    uri:
                      provider.avatar_url ||
                      'https://www.google.com/url?sa=i&url=https%3A%2F%2Fsemantic-ui.com%2Fviews%2Fcard.html&psig=AOvVaw02kCFa9rAXJLLL6nKDugRC&ust=1593182424835000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCMCNn5iZneoCFQAAAAAdAAAAABAi',
                  }}
                />
                <ProviderName selected={provider.id === selectedProvider}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProvidersListContainer>
        <Calendar>
          <CalendarTitle>Escolha uma data</CalendarTitle>

          <OpenDatePickerButton onPress={handleToggleDatePicker}>
            <OpenDatePickerButtonText>
              Selecionar outra Data
            </OpenDatePickerButtonText>
          </OpenDatePickerButton>

          {showDatePicker && (
            <DateTimePicker
              onChange={handleDateChanged}
              mode="date"
              display="calendar"
              textColor="#f4ede8"
              value={selectedDate}
            />
          )}
        </Calendar>
        <Schedule>
          <ScheduleTitle>Escolha um horário</ScheduleTitle>

          <Section>
            <SectionTitle>Manhã</SectionTitle>

            <SectionContent>
              {morningAvailability.map(
                ({ hourFormatted, hour, availability }) => (
                  <Hour
                    enabled={availability}
                    selected={selectedHour === hour}
                    onPress={() => handleSelectHour(hour)}
                    availability={availability}
                    key={hourFormatted}
                  >
                    <HourText selected={selectedHour === hour}>
                      {hourFormatted}
                    </HourText>
                  </Hour>
                ),
              )}
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent>
              {afternoonAvailability.map(
                ({ hourFormatted, hour, availability }) => (
                  <Hour
                    enabled={availability}
                    selected={selectedHour === hour}
                    onPress={() => handleSelectHour(hour)}
                    availability={availability}
                    key={hourFormatted}
                  >
                    <HourText selected={selectedHour === hour}>
                      {hourFormatted}
                    </HourText>
                  </Hour>
                ),
              )}
            </SectionContent>
          </Section>
        </Schedule>
        <CreateAppointmentButton onPress={handleCreateAppointment}>
          <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
        </CreateAppointmentButton>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
