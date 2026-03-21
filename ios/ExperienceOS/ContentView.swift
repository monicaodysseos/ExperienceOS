import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DiscoverView()
                .tabItem {
                    Label("Discover", systemImage: "magnifyingglass")
                }

            BookingsView()
                .tabItem {
                    Label("My Bookings", systemImage: "calendar")
                }

            MessagesView()
                .tabItem {
                    Label("Messages", systemImage: "message")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
        }
    }
}

// MARK: - Discover
struct DiscoverView: View {
    @State private var searchText: String = ""
    @State private var selectedCategory: String? = nil

    private let categories: [String] = [
        "Workshops", "Tours", "Wellness", "Food & Drink", "Arts", "Team Favorites"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)
                    TextField("Search experiences, e.g. cooking, improv", text: $searchText)
                        .textInputAutocapitalization(.never)
                        .disableAutocorrection(true)
                }
                .padding(10)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding([.horizontal, .top])

                // Categories chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.self) { cat in
                            Button {
                                selectedCategory = (selectedCategory == cat) ? nil : cat
                            } label: {
                                Text(cat)
                                    .font(.subheadline)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == cat ? Color.accentColor.opacity(0.15) : Color.gray.opacity(0.12))
                                    .foregroundStyle(selectedCategory == cat ? .accent : .primary)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Placeholder results list
                List(sampleListings.filter { listing in
                    (searchText.isEmpty || listing.title.localizedCaseInsensitiveContains(searchText)) &&
                    (selectedCategory == nil || listing.category == selectedCategory)
                }) { listing in
                    NavigationLink(value: listing) {
                        ListingRow(listing: listing)
                    }
                }
                .listStyle(.plain)
                .navigationDestination(for: Listing.self) { listing in
                    ListingDetailView(listing: listing)
                }
            }
            .navigationTitle("Discover")
        }
    }
}

struct ListingRow: View {
    let listing: Listing
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 64, height: 64)
                .overlay {
                    Image(systemName: listing.icon)
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }
            VStack(alignment: .leading, spacing: 4) {
                Text(listing.title)
                    .font(.headline)
                Text("€\(listing.price, specifier: "%.0f") per person • \(listing.duration) min")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(listing.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct ListingDetailView: View {
    let listing: Listing
    @State private var quantity: Int = 1

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.15))
                    .frame(height: 180)
                    .overlay {
                        Image(systemName: listing.icon)
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                    }

                Text(listing.title)
                    .font(.title2.bold())
                Text(listing.description)
                    .font(.body)
                    .foregroundStyle(.secondary)

                HStack {
                    Label("\(listing.duration) min", systemImage: "clock")
                    Label("€\(listing.price, specifier: "%.0f")", systemImage: "eurosign")
                    Label(listing.category, systemImage: "tag")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)

                Stepper("Quantity: \(quantity)", value: $quantity, in: 1...10)

                Button {
                    // TODO: Hook into booking flow
                } label: {
                    Text("Book Now")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .navigationTitle("Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Bookings
struct BookingsView: View {
    var body: some View {
        NavigationStack {
            List(sampleBookings) { booking in
                VStack(alignment: .leading, spacing: 6) {
                    Text(booking.listing.title)
                        .font(.headline)
                    Text("\(booking.date.formatted(date: .abbreviated, time: .shortened)) • Qty: \(booking.quantity)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("My Bookings")
        }
    }
}

// MARK: - Messages
struct MessagesView: View {
    var body: some View {
        NavigationStack {
            List(sampleThreads) { thread in
                HStack {
                    Circle().fill(Color.gray.opacity(0.2)).frame(width: 36, height: 36)
                        .overlay { Image(systemName: "person").foregroundStyle(.secondary) }
                    VStack(alignment: .leading) {
                        Text(thread.participant)
                            .font(.headline)
                        Text(thread.lastMessage)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    Text(thread.updatedAt, style: .time)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Messages")
        }
    }
}

// MARK: - Profile
struct ProfileView: View {
    @State private var name: String = "Alex"
    @State private var email: String = "alex@example.com"
    @State private var notificationsEnabled: Bool = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .disableAutocorrection(true)
                }

                Section("Preferences") {
                    Toggle("Email Notifications", isOn: $notificationsEnabled)
                }

                Section {
                    Button(role: .destructive) {
                        // TODO: Log out
                    } label: {
                        Text("Log Out")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

// MARK: - Sample Models & Data (temporary placeholders)
struct Listing: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let description: String
    let category: String
    let duration: Int
    let price: Double
    let icon: String
}

struct Booking: Identifiable {
    let id = UUID()
    let listing: Listing
    let date: Date
    let quantity: Int
}

struct MessageThread: Identifiable {
    let id = UUID()
    let participant: String
    let lastMessage: String
    let updatedAt: Date
}

let sampleListings: [Listing] = [
    .init(title: "Nicosia Cooking Class", description: "Learn to make traditional Cypriot dishes in a hands-on class.", category: "Food & Drink", duration: 120, price: 35, icon: "fork.knife"),
    .init(title: "Limassol Seaside Yoga", description: "Sunrise yoga session by the sea for all levels.", category: "Wellness", duration: 60, price: 15, icon: "figure.yoga"),
    .init(title: "Old Town Walking Tour", description: "Explore hidden gems and history with a local guide.", category: "Tours", duration: 90, price: 20, icon: "figure.walk")
]

let sampleBookings: [Booking] = [
    .init(listing: sampleListings[0], date: .now.addingTimeInterval(60*60*24*3), quantity: 2),
    .init(listing: sampleListings[2], date: .now.addingTimeInterval(60*60*24*7), quantity: 1)
]

let sampleThreads: [MessageThread] = [
    .init(participant: "Maria", lastMessage: "See you at 6pm!", updatedAt: .now.addingTimeInterval(-3600)),
    .init(participant: "Giorgos", lastMessage: "Is there parking nearby?", updatedAt: .now.addingTimeInterval(-7200))
]

#Preview {
    ContentView()
}

