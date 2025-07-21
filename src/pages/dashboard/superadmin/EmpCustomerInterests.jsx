import React, { useState, useEffect, useCallback } from "react";
import { Loader, Card, Text, Group, Image, Badge, useMantineTheme, useMantineColorScheme } from "@mantine/core"; // Import useMantineTheme and useMantineColorScheme
import { toast } from "sonner";
import { getData } from "../../../store/httpService";
import { FiHeart } from "react-icons/fi";

const EmpCustomerInterests = ({ user_id }) => {
  const [sentInterests, setSentInterests] = useState([]);
  const [receivedInterests, setReceivedInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [interestsError, setInterestsError] = useState(null);

  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme(); // Get current color scheme
  const isDarkMode = colorScheme === 'dark';

  // Define a custom color palette that adapts to dark mode
  const colors = {
    primaryRose: isDarkMode ? theme.colors.pink[4] : '#E0115F', // Lighter pink for dark, original for light
    lightRose: isDarkMode ? theme.colors.dark[8] : '#FFF0F5',   // Darker background for cards in dark mode
    softRose: isDarkMode ? theme.colors.dark[7] : '#FFE4E1',    // Darker border/secondary background for dark mode
    darkText: isDarkMode ? theme.colors.gray[2] : '#4A4A4A',    // Lighter text for dark mode
    dimmedText: isDarkMode ? theme.colors.gray[4] : '#7A7A7A',  // Lighter dimmed text for dark mode
    status: {
      accepted: theme.colors.green[6],
      rejected: theme.colors.red[6],
      pending: theme.colors.orange[5],
    },
    badgeText: '#FFFFFF',
    initialsBg: isDarkMode ? theme.colors.dark[6] : '#E0BBE4', // Darker background for initials in dark mode
    initialsText: isDarkMode ? theme.colors.gray[0] : '#8E44AD' // Lighter text for initials in dark mode
  };

  // Fetch interests
  const fetchInterests = useCallback(async () => {
    setLoadingInterests(true);
    setInterestsError(null);
    try {
      const response = await getData(`/employee/customer/interests/${user_id}/`);
      setSentInterests(response.data.sent_interests || []);
      setReceivedInterests(response.data.received_interests || []);
    } catch (err) {
      console.error("Failed to fetch interests:", err);
      setInterestsError("Failed to load interests. Please try again.");
      toast.error("Failed to load interests. Please try again.");
    } finally {
      setLoadingInterests(false);
    }
  }, [user_id]);

  useEffect(() => {
    if (user_id) {
      fetchInterests();
    } else {
      setInterestsError("Invalid customer ID.");
      setLoadingInterests(false);
    }
  }, [fetchInterests, user_id]);

  // Get initials for profile picture placeholder
  const getInitials = (name) => {
    if (!name) return "NA";
    const words = name.split(" ").filter(Boolean);
    if (words.length === 0) return "NA";
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Render Interests Section
  const renderInterestsSection = (title, interests, type) => {
    return (
      <div className="mb-8" style={{ color: colors.darkText }}>
        <Text
          size="xl"
          fw={700}
          className="mb-4 pb-2 flex items-center"
          style={{ color: colors.primaryRose, borderBottom: `2px solid ${colors.softRose}` }}
        >
          <FiHeart className="mr-2" style={{ color: colors.primaryRose }} />
          {title} Interests
        </Text>
        {loadingInterests ? (
          <div className="flex justify-center py-4">
            <Loader color={colors.primaryRose} size="md" type="dots" />
          </div>
        ) : interestsError ? (
          <Text c="red" size="sm" style={{ color: theme.colors.red[7] }}>
            {interestsError}
          </Text>
        ) : interests.length === 0 ? (
          <Text c="dimmed" size="sm" style={{ color: colors.dimmedText }}>
            No {title.toLowerCase()} interests found.
          </Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interests.map((interest, index) => {
              const name = type === "sent" ? interest.profile?.name : interest.customer?.name || "Unknown";
              const id = type === "sent" ? interest.profile?.user_id : interest.customer?.user_id || "N/A";
              const age = type === "sent" ? interest.profile?.age : interest.customer?.age || "N/A";
              const profilePic =
                interest.profile_photos ||
                (type === "sent" ? interest.profile?.profile_photos : interest.customer?.profile_photos) ||
                null;
              const status = interest.status || "pending";
              const date = interest.created_at;

              const getStatusColor = (s) => {
                const lowerStatus = s.toLowerCase();
                if (lowerStatus === "accepted") return colors.status.accepted;
                if (lowerStatus === "rejected") return colors.status.rejected;
                return colors.status.pending;
              };

              return (
                <Card
                  key={`${type}-${index}`}
                  shadow="sm"
                  padding="md"
                  radius="md"
                  withBorder
                  className="transition-all duration-300"
                  style={{
                    backgroundColor: colors.lightRose,
                    borderColor: colors.softRose,
                    minHeight: "120px",
                    cursor: 'pointer', // Indicate interactivity
                    // Mantine theme shadows are responsive to dark/light mode
                    boxShadow: theme.shadows.sm,
                  }}
                  // Add subtle hover effect using Mantine's theme
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                    e.currentTarget.style.borderColor = colors.primaryRose;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.borderColor = colors.softRose;
                  }}
                >
                  <Group align="center" wrap="nowrap">
                    {/* Profile Picture or Initials */}
                    <div className="w-14 h-14 flex-shrink-0">
                      {profilePic ? (
                        <Image
                          src={profilePic}
                          alt={`${name}'s profile`}
                          radius="full"
                          width={56}
                          height={56}
                          fit="cover"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg"
                          style={{ backgroundColor: colors.initialsBg, color: colors.initialsText }}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1">
                      <Group position="apart">
                        <Text fw={500} size="md" style={{ color: colors.primaryRose }}>
                          {name} ({id})
                        </Text>
                        <Badge
                          color={getStatusColor(status)}
                          variant="light"
                          size="sm"
                          className="capitalize"
                          style={{ color: getStatusColor(status), backgroundColor: `${getStatusColor(status)}1A` }} // Lighter background for badge
                        >
                          {status}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed" style={{ color: colors.dimmedText }}>
                        Age: {age}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ color: colors.dimmedText }}>
                        Date: {formatDate(date)}
                      </Text>
                    </div>
                  </Group>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: isDarkMode ? theme.colors.dark[9] : colors.lightRose }}>
      {renderInterestsSection("Sent", sentInterests, "sent")}
      {renderInterestsSection("Received", receivedInterests, "received")}
    </div>
  );
};

export default EmpCustomerInterests;