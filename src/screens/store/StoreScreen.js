import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { BlurView } from 'expo-blur';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import {
  spendVitalityPoints,
  spendLuminescenceGems,
  updateSubscription,
  addToInventory,
} from '../../state/slices/monetizationSlice';

const StoreScreen = ({ route }) => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(
    route.params?.showSubscriptions ? 'subscriptions' : 'items'
  );
  
  const currencies = useSelector(state => state.monetization.currencies);
  const subscription = useSelector(state => state.monetization.subscription);
  const inventory = useSelector(state => state.monetization.inventory);

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 4.99,
      period: 'month',
      features: [
        'Ad-free experience',
        'Basic pet accessories',
        'Standard meditation content',
      ],
    },
    {
      id: 'mindfulPro',
      name: 'Mindful Pro',
      price: 9.99,
      period: 'month',
      features: [
        'All Basic features',
        'Premium pet accessories',
        'Advanced meditation content',
        'Exclusive challenges',
        'Priority support',
      ],
      recommended: true,
    },
    {
      id: 'communityHero',
      name: 'Community Hero',
      price: 14.99,
      period: 'month',
      features: [
        'All Pro features',
        'Host unlimited playdates',
        'Create community challenges',
        'Early access to new features',
        'VIP support',
      ],
    },
  ];

  const storeItems = [
    {
      id: 'rainbow_aura',
      name: 'Rainbow Aura',
      description: 'Give your pet a magical rainbow aura',
      price: { points: 1000 },
      type: 'cosmetic',
      image: require('../../../assets/store/rainbow_aura.png'),
    },
    {
      id: 'meditation_pack',
      name: 'Zen Master Pack',
      description: 'Unlock advanced meditation content',
      price: { gems: 100 },
      type: 'content',
      image: require('../../../assets/store/meditation_pack.png'),
    },
    // Add more items as needed
  ];

  const handlePurchase = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (item.price.points) {
      if (currencies.vitalityPoints >= item.price.points) {
        dispatch(spendVitalityPoints(item.price.points));
        dispatch(addToInventory(item));
        Alert.alert('Success', 'Item purchased successfully!');
      } else {
        Alert.alert('Insufficient Points', 'You need more Vitality Points to purchase this item.');
      }
    } else if (item.price.gems) {
      if (currencies.luminescenceGems >= item.price.gems) {
        dispatch(spendLuminescenceGems(item.price.gems));
        dispatch(addToInventory(item));
        Alert.alert('Success', 'Item purchased successfully!');
      } else {
        Alert.alert('Insufficient Gems', 'You need more Luminescence Gems to purchase this item.');
      }
    }
  };

  const handleSubscribe = (plan) => {
    // In a real app, this would integrate with a payment processor
    Alert.alert(
      'Confirm Subscription',
      `Would you like to subscribe to the ${plan.name} plan for $${plan.price}/${plan.period}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            dispatch(updateSubscription({
              tier: plan.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              features: plan.features,
              autoRenew: true,
            }));
            Alert.alert('Success', 'Subscription activated successfully!');
          },
        },
      ]
    );
  };

  const renderCurrencies = () => (
    <BlurView intensity={80} style={styles.currencyBar}>
      <View style={styles.currency}>
        <Icon name="star" size={24} color="#FFD700" />
        <Text style={styles.currencyText}>
          {currencies.vitalityPoints} Points
        </Text>
      </View>
      <View style={styles.currency}>
        <Icon name="diamond" size={24} color="#00BCD4" />
        <Text style={styles.currencyText}>
          {currencies.luminescenceGems} Gems
        </Text>
      </View>
    </BlurView>
  );

  const renderCategories = () => (
    <View style={styles.categories}>
      <TouchableOpacity
        style={[
          styles.categoryTab,
          selectedCategory === 'items' && styles.activeCategory,
        ]}
        onPress={() => setSelectedCategory('items')}
      >
        <Text style={styles.categoryText}>Items</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.categoryTab,
          selectedCategory === 'subscriptions' && styles.activeCategory,
        ]}
        onPress={() => setSelectedCategory('subscriptions')}
      >
        <Text style={styles.categoryText}>Subscriptions</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStoreItems = () => (
    <View style={styles.itemsGrid}>
      {storeItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.itemCard}
          onPress={() => handlePurchase(item)}
          disabled={inventory.some(i => i.id === item.id)}
        >
          <Image source={item.image} style={styles.itemImage} />
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <View style={styles.priceTag}>
            <Icon
              name={item.price.points ? 'star' : 'diamond'}
              size={16}
              color={item.price.points ? '#FFD700' : '#00BCD4'}
            />
            <Text style={styles.priceText}>
              {item.price.points || item.price.gems}
            </Text>
          </View>
          {inventory.some(i => i.id === item.id) && (
            <View style={styles.ownedOverlay}>
              <Text style={styles.ownedText}>Owned</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSubscriptions = () => (
    <View style={styles.subscriptionsList}>
      {subscriptionPlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.subscriptionCard,
            plan.recommended && styles.recommendedCard,
            subscription.tier === plan.id && styles.activeSubscriptionCard,
          ]}
          onPress={() => handleSubscribe(plan)}
          disabled={subscription.tier === plan.id}
        >
          {plan.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Best Value</Text>
            </View>
          )}
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>
            ${plan.price}/{plan.period}
          </Text>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {subscription.tier === plan.id ? (
            <View style={styles.activeButton}>
              <Text style={styles.activeButtonText}>Current Plan</Text>
            </View>
          ) : (
            <View style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCurrencies()}
      {renderCategories()}
      <ScrollView style={styles.content}>
        {selectedCategory === 'items' ? renderStoreItems() : renderSubscriptions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  currencyBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  categories: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeCategory: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  itemCard: {
    width: '45%',
    margin: '2.5%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  priceText: {
    marginLeft: 5,
    fontWeight: '500',
  },
  ownedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscriptionsList: {
    padding: 15,
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  recommendedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  activeSubscriptionCard: {
    backgroundColor: '#F5F5F5',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    color: '#4CAF50',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    color: '#666',
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  activeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoreScreen;
